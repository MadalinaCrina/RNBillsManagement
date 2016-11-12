import {
  OK, NOT_FOUND, LAST_MODIFIED, NOT_MODIFIED, BAD_REQUEST, ETAG,
  CONFLICT, METHOD_NOT_ALLOWED, NO_CONTENT, CREATED, setIssueRes
} from './utils';
import Router from 'koa-router';
import {getLogger} from './utils';

const log = getLogger('bill');

let billsLastUpdateMillis = null;

export class BillRouter extends Router {
  constructor(props) {
    super(props);
    this.billStore = props.billStore;
    this.io = props.io;
    this.get('/', async(ctx) => {
      let res = ctx.response;
      let lastModified = ctx.request.get(LAST_MODIFIED);
      if (lastModified && billsLastUpdateMillis && billsLastUpdateMillis <= new Date(lastModified).getTime()) {
        log('search / - 304 Not Modified (the client can use the cached data)');
        res.status = NOT_MODIFIED;
      } else {
        res.body = await this.billStore.find({});
        if (!billsLastUpdateMillis) {
          billsLastUpdateMillis = Date.now();
        }
        res.set({[LAST_MODIFIED]: new Date(billsLastUpdateMillis)});
        log('search / - 200 Ok');
      }
    }).get('/:id', async(ctx) => {
      let bill = await this.billStore.findOne({_id: ctx.params.id});
      let res = ctx.response;
      if (bill) {
        log('read /:id - 200 Ok');
        this.setBillRes(res, OK, bill); //200 Ok
      } else {
        log('read /:id - 404 Not Found (if you know the resource was deleted, then you can return 410 Gone)');
        setIssueRes(res, NOT_FOUND, [{warning: 'Bill not found'}]);
      }
    }).post('/', async(ctx) => {
      let bill = ctx.request.body;
      let res = ctx.response;
      if (bill.text ) { //validation
        await this.createBill(res, bill);
      } else {
        log(`create / - 400 Bad Request`);
        setIssueRes(res, BAD_REQUEST, [{error: 'Text is missing'}]);
      }
    }).put('/:id', async(ctx) => {
      let bill = ctx.request.body;
      let id = ctx.params.id;
      let billId = bill._id;
      let res = ctx.response;
      if (billId && billId != id) {
        log(`update /:id - 400 Bad Request (param id and body _id should be the same)`);
        setIssueRes(res, BAD_REQUEST, [{error: 'Param id and body _id should be the same'}]);
        return;
      }
      if (!bill.text) {
        log(`update /:id - 400 Bad Request (validation errors)`);
        setIssueRes(res, BAD_REQUEST, [{error: 'Text is missing'}]);
        return;
      }
      if (!billId) {
        await this.createBill(res, bill);
      } else {
        let persistedBill = await this.billStore.findOne({_id: id});
        if (persistedBill) {
          let billVersion = parseInt(ctx.request.get(ETAG)) || bill.version;
          if (!billVersion) {
            log(`update /:id - 400 Bad Request (no version specified)`);
            setIssueRes(res, BAD_REQUEST, [{error: 'No version specified'}]); //400 Bad Request
          } else if (billVersion < persistedBill.version) {
            log(`update /:id - 409 Conflict`);
            setIssueRes(res, CONFLICT, [{error: 'Version conflict'}]); //409 Conflict
          } else {
            bill.version = billVersion + 1;
            bill.updated = Date.now();
            let updatedCount = await this.billStore.update({_id: id}, bill);
            billsLastUpdateMillis = bill.updated;
            if (updatedCount == 1) {
              this.setBillRes(res, OK, bill); //200 Ok
              this.io.emit('bill-updated', bill);
            } else {
              log(`update /:id - 405 Method Not Allowed (resource no longer exists)`);
              setIssueRes(res, METHOD_NOT_ALLOWED, [{error: 'Bill no longer exists'}]); //
            }
          }
        } else {
          log(`update /:id - 405 Method Not Allowed (resource no longer exists)`);
          setIssueRes(res, METHOD_NOT_ALLOWED, [{error: 'Bill no longer exists'}]); //Method Not Allowed
        }
      }
    }).del('/:id', async(ctx) => {
      let id = ctx.params.id;
      await this.billStore.remove({_id: id});
      this.io.emit('bill-deleted', {_id: id})
      billsLastUpdateMillis = Date.now();
      ctx.response.status = NO_CONTENT;
      log(`remove /:id - 200 Ok , or 204 No content (even if the resource was already deleted)`);
    });
  }

  async createBill(res, bill) {
    bill.version = 1;
    bill.updated = Date.now();
    let insertedBill = await this.billStore.insert(bill);
    billsLastUpdateMillis = bill.updated;
    this.setBillRes(res, CREATED, insertedBill); //201 Created
    this.io.emit('bill-created', insertedBill);
  }

  setBillRes(res, status, bill) {
    res.body = bill;
    res.set({
      [ETAG]: bill.version,
      [LAST_MODIFIED]: new Date(bill.updated)
    });
    res.status = status; //200 Ok or 201 Created
  }
}
