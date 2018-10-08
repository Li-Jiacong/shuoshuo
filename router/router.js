const formidable = require("formidable");
const db = require("../models/db");
const md5 = require("../models/md5");
const path = require("path");
const fs = require("fs");
const gm = require("gm");



//首页
exports.showIndex = (req,res,next)=>{
    if(req.session.login == "1"){
        var username = req.session.username;
        var login = true;
    }else{
        var username = "";
        var login = false;
    }

    db.find("users",{"username":username},(err,result)=>{
        if(result.length == 0){
            var avatar = "default.jpg";
        }else{
            var avatar = result[0].avatar;
        }
        res.render("index",{
            "login": login,
            "username": username,
            "active": "index",
            "avatar": avatar
        });
    })
    
}
//注册页面
exports.showRegister = (req,res,next)=>{
    res.render("register",{
        "login": req.session.login?true:false,
        "username": req.session.login=="1"?req.session.username:" ",
        "active": "register"
    });
    
}
//注册业务
exports.doRegister = (req,res,next)=>{
    //获取用户填写的信息
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
    //获取信息
    let username = fields.username;
    let password = fields.password;
    // console.log(username+password);
    //查询数据库是否已经存在该用户名
    //如果不存在，保存注册信息
    db.find("users",{"username":username},(err,result)=>{
        if(err){
            res.send("-3");//服务器错误
            return;
        }
        if(result.length != 0){
            res.send("-1");//用户名已被注册
            return;
        }
        // console.log(result.length);
        password = md5(md5(password)+"lijiacong"); //对密码进行加密
        db.insertOne("users",{"username":username,"password":password,"avatar":"default.jpg"},(err,result)=>{
            if(err){
                res.send("-3");//服务器错误
                return;
            }
            req.session.login = "1";
            req.session.username = username;
            res.send("1");//res.send一定是写在最后面的，这个要注意
        })
    })

    
    });
}
//登录页面
exports.showLogin = (req,res,next)=>{
    res.render("login",{
        "login": req.session.login?true:false,
        "username": req.session.login=="1"?req.session.username:" ",
        "active": "login"
    });
}
//登录业务
exports.doLogin = (req,res,next)=>{
    //获取用户填写的信息
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        //获取信息
        let username = fields.username;
        let password = fields.password;
        // console.log(username+password);
        //查询数据库，看看用户名是否存在
        db.find("users",{"username":username},(err,result)=>{
            if(err){
                res.send("-3"); //服务器错误
                return;
            }
            if(result.length == 0){
                res.send("-1"); //用户名不存在
                return;
            }
            password = md5(md5(password)+"lijiacong");
            if(result[0].password != password){
                res.send("-2"); //密码错误
                return;
            }else{
                //登录成功设置session
                req.session.login = 1;
                req.session.username = result[0].username;
                res.send("1"); //登录成功
                return;
            }
        })
    })
}
//设置头像页面
exports.showSetAvatar = (req,res,next)=>{
    if(req.session.login != 1){
        res.send("未登录");
    }else{
        res.render("setAvatar",{
            "login": req.session.login?true:false,
            "username": req.session.login=="1"?req.session.username:" ",
            "active": "index"
        });
    }
}
//设置头像
exports.doSetAvatar = (req,res,next)=>{
    if(req.session.login != 1){
        res.send("未登录");
        return;
    }
    //这里有一个巨坑的东西啊，在上传文件的那个input标签一定要记得加上name属性，啊太绝望了不报错然后文件一直传不上
    var form = new formidable.IncomingForm();
    form.uploadDir = path.normalize(__dirname + "/../avatar");
    form.parse(req, function(err, fields, files) {
        if(err){
            res.send("上传图片失败");
            return;
        }
        let extname = path.extname(files.avatar.name);
        let oldpath = files.avatar.path;
        let newpath = path.normalize(__dirname + "/../avatar/" + req.session.username + extname);
        fs.rename(oldpath, newpath, (err)=>{
            if(err){
                res.send("修改图片路径名字失败");
                return;
            }else{
                //跳转到切图页面，但是要先将图片名缓存起来，可以在切图页面引用
                req.session.avatar = req.session.username + extname;
                res.redirect("/cut");
            }
        })
    });
}
//切图页面
exports.showCut = (req,res,next)=>{
    res.render("cut",{
        avatar: req.session.avatar
    });
}
//切图业务
exports.doCut = (req,res,next)=>{
    //这个页面接收几个GET请求参数
    //文件名、w、h、x、y
    var filename = req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;

    gm("./avatar/" + filename)
        .resize(400,400)  //为了防止图片太小或太大，统一先resize为宽为400px
        .crop(w,h,x,y)
        .resize(100,100,"!")
        .write("./avatar/" + filename, (err)=>{
        if(err){
            res.send("-1");
            return;
        }
        db.updateMany("users",{"username":req.session.username},{$set:{"avatar":req.session.avatar}},(err,result)=>{
            res.send("1");
        })
        
    });
};
//发表说说业务
exports.doPublishShuoshuo = (req,res,next)=>{
    if(req.session.login != 1){
        res.send("未登录");
        return;
    }
    let username = req.session.username;
    //获取用户填写的信息
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
    //获取信息
    let content = fields.content;
    db.insertOne("posts",{
       "username":username,
       "datetime":new Date(),
       "content":content
      },(err,result)=>{
        if(err){
            res.send("-3");//服务器错误
            return;
        }
        res.send("1");//成功
    })
    })
}
exports.getAllShuoshuo = (req,res,next)=>{
    let page = req.query.page;
    db.find("posts",{},{"pageamount":12,"page":page,"sort":{"datetime":-1}},(err,result)=>{
        if(err){
            res.send("服务器出错啦");
            return;
        }
        let obj = {"result":result};
        console.log(obj);
        res.json(obj);
    })
}
//获取用户信息，通过请求传入的用户名获取用户头像
exports.getUserInfo = (req,res,next)=>{
    let username = req.query.username;
    db.find("users",{"username":username},(err,result)=>{
        if(err){
            res.send("服务器出错啦");
            return;
        }
        res.send(result);
    })
}
//获取说说总条数
exports.getShuoshuoAmount = (req,res,next)=>{
    db.getAllCount("posts",function(count){
        // console.log(count);
        res.send(count.toString());//不能直接输出数字，好像会把纯数字当作状态码
    });
}
//显示该用户说说
exports.showUser = (req,res,next)=>{
    if(req.session.login != 1){
        res.send("未登录");
        return;
    }
    var username = req.params.username;
    db.find("posts",{"username":username},(err,result)=>{
        db.find("users",{"username":username},(err,result2)=>{
            res.render("user",{
                "login": true,
                "username": username,
                "active":"myshuoshuo",
                "myShuoshuo": result,
                "avatar": result2[0].avatar
            })
        })
        
    })
    
}
exports.getUserlist = (req,res,next)=>{
    if(req.session.login != 1){
        res.send("未登录");
        return;
    }
    db.find("users",{},(err,result)=>{
        res.render("userlist",{
            "login": true,
            "username": req.session.username,
            "active":"userlist",
            "result":result
        })
    })
}