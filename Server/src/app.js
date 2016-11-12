import Koa from 'koa';
import cors from 'koa-cors';
import convert from 'koa-convert';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import http from 'http';
import socketIo from 'socket.io';
import dataStore from 'nedb-promise';
import {getLogger, timingLogger, errorHandler} from './utils';
import {BillRouter} from './bill-router';
import {AuthRouter, jwtConfig} from './auth-router';
import koaJwt from 'koa-jwt';

const app = new Koa();
const router = new Router();
const server = http.createServer(app.callback());
const io = socketIo(server);
const log = getLogger('app');

app.use(timingLogger);
app.use(errorHandler);

app.use(bodyParser());
app.use(convert(cors()));

const apiUrl = '/api';

log('config public routes');
const authApi = new Router({prefix: apiUrl})
const userStore = dataStore({filename: '../users.json', autoload: true});
authApi.use('/auth', new AuthRouter({userStore, io}).routes())
app.use(authApi.routes()).use(authApi.allowedMethods())

log('config protected routes');
app.use(convert(koaJwt(jwtConfig)));
const protectedApi = new Router({prefix: apiUrl})
const billStore = dataStore({filename: '../bills.json', autoload: true});
protectedApi.use('/bill', new BillRouter({billStore, io}).routes())
app.use(protectedApi.routes()).use(protectedApi.allowedMethods());

log('config socket io');
io.on('connection', (socket) => {
  log('client  connected');
  socket.on('disconnect', () => {
    log('client disconnected');
  })
});

(async() => {
  log('ensure default data');
  let admin = await userStore.findOne({username: 'a'});
  if (admin) {
    log(`admin user was in the store`)
  } else {
    admin = await userStore.insert({username: 'a', password: 'a'});
    log(`admin added ${JSON.stringify(admin)}`);
  }
  let bills = await billStore.find({});
  if (bills.length > 0) {
    log(`bill store has ${bills.length} bills`)
  } else {
    log(`bill store was empty, adding some bills`)
    for (let i = 0; i < 3; i++) {
      let bill = await billStore.insert({text: `Bill ${i}`, price:`${i}`, status: "active", updated: Date.now(), user: admin._id, version: 1});
      log(`bill added ${JSON.stringify(bill)}`);
    }
  }
})();

server.listen(3000);