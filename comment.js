var express = require('express');
var router = express.Router();

var authCheck = require('./authCheck.js');
var template = require('./template.js');
var db = require('./db.js');


router.get('/:id', function (request, response) {
    if (!authCheck.isOwner(request, response)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
        response.send(`<script type="text/javascript">alert("로그인부터 하셔야죠!!"); 
                document.location.href="/auth/login";</script>`);
        
       return false;
    }
    const id = request.params.id;

    var sql = 'SELECT * FROM commenttable';
    var html = '';
    html += `<a href="/comment/write/${id}">댓글 작성</a> | <a href="/board/${id}">본문 보기</a>`;

    var realid = request.session.nickname;

    db.query(sql, function(err, rows, fields){
      if(err){
          console.log(err);
        } else {
            for(var i = 0; i < rows.length; i++){
              var author = rows[i].username;
              var comment = rows[i].comment;
              var id2 = rows[i].post;
              var commentid = rows[i].id;
                if (id == id2) {
                  html += `
                          <h2>${author}</h2>
                          <h3>${comment}</h3>
                          `
                if (realid == rows[i].realname) html += `
                          <form action="/comment/delete_process/${commentid}" method="post">
                          <p><input class="btn" type="submit" value="댓글 삭제"></p>
                          </form>
                          `

                html += '<hr>';
                }
            }
            response.send(html);
        }

    });
}); 

//댓글 등록
router.get('/write/:id', function (request, response) {
  if (!authCheck.isOwner(request, response)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
    response.send(`<script type="text/javascript">alert("로그인부터 하셔야죠!!"); 
            document.location.href="/auth/login";</script>`);
   return false;
  }
  const id = request.params.id;
  var title = '댓글등록';
  var html = template.HTML(title,`
          <h2>댓글등록</h2>
          <form action="/comment/write_process/${id}" method="post">
          <p><input type="username" name="username" placeholder="이름"></p>
          <p><input type="comment" name="comment" placeholder="내용"></p>
          <p><input class="btn" type="submit" value="글 등록"></p>
          </form>            
      `, '');
  response.send(html);
});

router.post('/write_process/:id', function(request, response) {    
  var comment = request.body.comment;    
  var username = request.body.username; 
  var realid = request.session.nickname;
  const id = request.params.id;

  console.log("아아 왜 안 돼용오오오");

  if (comment && username) {
      
          if (comment.length < 250 && username.length < 50) {
              db.query('INSERT INTO commenttable (comment, username, post, realname) VALUES(?,?,?,?)', [comment, username, id, realid], function (error, data) {
                  if (error) throw error;
                  response.send(`<script type="text/javascript">alert("댓글 등록이 완료되었습니다!");
                  document.location.href="/comment/${id}";</script>`);
              });
          } else {
            response.send(`<script type="text/javascript">alert("내용은 250자까지 입력 가능합니다."); 
              document.location.href="/sibal";</script>`); 
          }           
  } else {
    response.send(`<script type="text/javascript">alert("이름, 내용을 모두 입력하세요."); 
              document.location.href="/sibal";</script>`); 
  }
});


//댓글 삭제
router.post('/delete_process/:id', function(request, response) {    
  const id = request.params.id;

  var sql = 'DELETE FROM commenttable WHERE id = ?';
  var params = [id];
  db.query(sql, params, function (error, data) {
      if (error) throw error;
      response.send(`<script type="text/javascript">alert("댓글 삭제가 완료되었습니다!");
      document.location.href="/board";</script>`);
  });
});


module.exports = router