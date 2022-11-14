var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var MySQLStore = require('express-mysql-session')(session);
var mysql = require('mysql');
var base64 = require('base-64')
var conn = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password: 'kyh04138338!!',
    database: 'o2'
});
conn.connect();

var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
    secret: '123412sadfF1312@#!F',
    resave: false,
    saveUninitialized: true,
    store :  new MySQLStore({
        host : 'localhost',
        port : 3306,
        user: 'root',
        password: 'kyh04138338!!',
        database: 'o2',
        path : './sessions'})
}));

app.get('/count', function(req,res){
    if(req.session.count){ //count값이 이미 설정 되어 있다면
        req.session.count ++;
    }else{
        req.session.count = 1;
    } //세션에 카운트 값을 저장
    res.send('count :' + req.session.count);
})

app.get('/auth/logout', function(req,res){
    
    req.session.destroy(); //쿠키 지워버려서 지금 유저가 들어온지도 모르게 만든다.

    res.redirect('/welcome');

    //로그아웃 하기 위해선 세션 정보를 지워버려야 한다..

});

app.get('/',function(req,res){
    res.redirect('/welcome');
});

app.get('/welcome', function(req,res){
    console.log(req.session.displayname);
    if(req.session.displayname){ //로그인을 성공한 경우, 즉 로그인 성공여부를 묻는다. 다음부터는 해당 부분에 id를 집어넣을 것.
        res.send(`
        <h1>Hello ${req.session.displayname}</h1>
        <a href = "/auth/logout">Logout</a>
        `);
    }else{ //로그인을 하지 못한 경우
        res.send(`
        <h1>Welcome</h1>
        <ul>
        <li><a href = "/auth/login">Login</a></li>
        <li><a href = "/auth/register">Register</a></li>
        </ul>
        `);
    }
});

// var users = [{
//         username : 'egoing',
//         password : '111',
//         displayname : 'Egoing'
// }

// ];


app.post('/auth/register', function(req,res){ 

    var user = {
        authId : req.body.username,
        username : req.body.username,
        password : req.body.password,
        salt : 'test',
        displayname : req.body.displayname
    };

    user.password = base64.encode(user.salt + req.body.password);

    var sql = `INSERT INTO users SET ?`;
    conn.query(sql, user, function(err, results){
        if(err){
            console.log(err);
            res.status(500);
        }else{
            req.session.displayname = req.body.displayname; //쿠키에 로그인 완료를 뜻하는 유저네임을 집어넣어준다~.
    
            req.session.save( () => {
                res.redirect('/welcome');
                }); 
        }
    });
    

});


app.get('/auth/register', function(req,res){
    
    var output = `
    <h1>Register</h1>
    <form action = "/auth/register" method = "post">
        <p>
            <input type = "text" name = "username" placeholder = "username">
        </p>
        <p>
            <input type = "password" name = "password" placeholder = "password">
        </p>
        <p>
            <input type = "text" name = "displayname" placeholder = "displayname">
        </p>
        <p>
            <input type = "submit">
        </p>
    </form>
    `;

    res.send(output);
});


app.post('/auth/login', function(req,res){ //로그인을 처리하는 기능 (사용자가 값을 입력하는 과정은 post로 작성해준다!)

    var uname = req.body.username;
    var pwd = req.body.password;

    var sql = 'SELECT * FROM users WHERE authID = ?';
    conn.query(sql, [uname], function(err,results){
        console.log(results);
        console.log(results[0].password);
        console.log(base64.encode(results[0].salt+pwd));
        if(err){
            return req.session.save( () => {
                            res.redirect('/auth/login');
                            });//유저가 없는경우 메세지 출력
        }

            if(base64.encode(results[0].salt+pwd) === results[0].password){ //비번이 일치하는 경우
                console.log(results[0].displayName);
                req.session.displayname = results[0].displayName;
                return req.session.save( () => {
                    res.redirect('/welcome');
                    });
            } //비번이 일치하지 않는 경우
            console.log('해결안됨');
            res.send(`who are you? <a href = '/auth/login'>login</a>` ); 
    });
    // for (var i = 0; i < users.length; i++)
    // {
    //     if(uname === users[i].username && pwd === users[i].password){ //ㄴ아이디의 일치여부 확인
    //         req.session.displayname = users[i].displayname;
    //         return req.session.save( () => {
    //             res.redirect('/welcome');
    //             }); //welcome이라는 페이지로 보내버린다! 그러나 res.redirect로만으론 끝나지 않으므로 return을 붙여줌.
    //     }
    // }
});

app.get('/auth/login', function(req,res){ //로그인 인터페이스

    var output = `
    <form action = "/auth/login" method = "post">
        <p>
            <input type = "text" name = "username" placeholder = "username">
        </p>
        <p>
            <input type = "password" name = "password" placeholder = "password">
        </p>
        <p>
            <input type = "submit">
        </p>
    </form>
    `;

    res.send(output);
})

app.listen(80,function(){
    console.log('Connected 80 port!!');
});