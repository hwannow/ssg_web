const express = require('express')
const session = require('express-session')
const bodyParser = require('body-parser');
const FileStore = require('session-file-store')(session)
const multer = require("multer");
const fs = require("fs");
require('date-utils');
const path = require('path');
var cors = require('cors');
var authRouter = require('./auth');
var domRouter = require('./domxss');
var paramRouter = require('./param');
var authCheck = require('./authCheck.js');
var template = require('./template.js');
var db = require('./db');
var boardRouter = require('./board');
var commentRouter = require('./comment');

var newDate = new Date();

const app = express()
const port = 3000

var storage = multer.diskStorage({
  destination: (request, file, callback) => {
      callback(null, 'uploads/');
  },
  filename: (request, file, callback) => {
      callback(null, file.originalname + '.jpeg');
  }
});

var upload = multer({ storage });

app.use('/uploads', express.static('uploads'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: '!!!',
  resave: false,
  saveUninitialized: true,
  store:new FileStore(),
}))
app.use(cors());


app.get('/practice', function (req, res, next) {
  res.jsonp({ name: 'Hwannow', age:20 });
  next();
})

app.get('/', (req, res) => {
  var html = template.HTML('Welcome',
    `<hr>
    <h2>This is Main Page</h2>
    <p>Hello, Web!</p>`,
    authCheck.statusUI(req, res)
  );
  res.send(html);
})


app.get('/sibal', function (request, response) {
  if (!authCheck.isOwner(request, response)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
    response.send(`<script type="text/javascript">alert("로그인부터 하셔야죠!!"); 
            document.location.href="/auth/login";</script>`);
   console.log("제발요"); 
   return false;
  }
  var title = '글등록';
  var html = template.HTML(title,`
  <h2>글등록</h2>
          <form action="/sibal_process" method="post" enctype="multipart/form-data">
          <p><input type="username" name="username" placeholder="이름"></p>
          <p><input type="subject" name="subject" placeholder="제목"></p>
          <p><input type="content" name="content" placeholder="내용"></p>
          <tr>
          <td>파일</td>
          <td><input type="file" name="uploadFile" multiple></td>
          </tr>

          <p><input class="btn" type="submit" value="글 등록"></p>
          </form>                
      `, '');
  response.send(html);
});

//글 등록 과정
app.post('/sibal_process', upload.single('uploadFile'), function(request, response) {    
  console.log(request.file)
  var subject = request.body.subject;
  var content = request.body.content;    
  var username = request.body.username; 
  var files = request.file;
  var realid = request.session.nickname;
  if (files != null)
    var filedir = files.filename

  
  if (subject && content && username) {
    //csrf 실습을 위해 길이를 500으로 늘려 코드 삽입함
    if (subject.length < 50 && content.length < 500 && username.length < 50) {
              db.query('INSERT INTO posttable (subject, content, author, realid, filedir) VALUES(?,?,?,?,?)', [subject, content, username, realid, filedir], function (error, data) {
                  if (error) throw error;
                    response.send(`<script type="text/javascript">alert("글 등록이 완료되었습니다!");
                    document.location.href="/board";</script>`);
              });
          } else {
            response.send(`<script type="text/javascript">alert("제목은 50자, 내용은 500자까지 입력 가능합니다."); 
              document.location.href="/sibal";</script>`); 
          }           
  } else {
    response.send(`<script type="text/javascript">alert("이름, 제목, 내용을 모두 입력하세요."); 
              document.location.href="/sibal";</script>`); 
  }
});


// 인증 라우터
app.use('/auth', authRouter);
app.use('/board', boardRouter);
app.use('/comment', commentRouter);
app.use('/param', paramRouter);
app.use('/domxss', domRouter);

app.listen(port, () => {
  const dir = "./uploads";
    if(!fs.existsSync(dir)) {
    	fs.mkdirSync(dir);
    }
    console.log("서버 실행");
})
