const express = require("express");
const app = express();
const router = require("./router/router.js"); 
const session = require('express-session');

//设置session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }//cookie-secure的值改为true，true意味着"指示浏览器仅通过 HTTPS 连接传回 cookie。这可以确保 cookie ID 是安全的，且仅用于使用 HTTPS 的网站。如果启用此功能，则 HTTP 上的会话 Cookie 将不再起作用。
  }))
//引擎模板
app.set("view engine","ejs");
//静态页面
app.use(express.static("./public"));
app.use(express.static("./avatar"));
//路由表
app.get("/",router.showIndex);
app.get("/register",router.showRegister);
app.post("/doRegister",router.doRegister);
app.get("/login",router.showLogin);
app.post("/doLogin",router.doLogin);
app.get("/setAvatar",router.showSetAvatar);
app.post("/doSetAvatar",router.doSetAvatar);
app.get("/cut",router.showCut);
app.get("/doCut",router.doCut);
app.post("/publishShuoshuo",router.doPublishShuoshuo);
app.get("/getAllShuoshuo",router.getAllShuoshuo);
app.get("/getUserInfo",router.getUserInfo);
app.get("/getShuoshuoAmount",router.getShuoshuoAmount);
app.get("/user/:username",router.showUser);
app.get("/userlist",router.getUserlist);

app.listen(3000);