var express = require('express');
var router = express.Router();
var fs = require('fs')

var authCheck = require('./authCheck.js');
var template = require('./template.js');
var db = require('./db');

router.get('/', function (request, response) {
    if (!authCheck.isOwner(request, response)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
        response.send(`<script type="text/javascript">alert("로그인부터 하셔야죠!!"); 
                document.location.href="/auth/login";</script>`);
        
       return false;
    }

    var sql = 'SELECT * FROM posttable';
    var html = 'This Is 게시판 | <a href="/">메인화면</a> | <a href="/sibal">글 등록</a> <hr>';
    db.query(sql, function(err, rows, fields){
      if(err){
          console.log(err);
        } else {
            for(var i = 0; i < rows.length; i++){
              var author = rows[i].author;
              var subject = rows[i].subject;
              //stored xss 실습 중 악성 스크립트가 한번 실행되게 하도록 내용 부분을 지움
              var id = rows[i].id;

              var title = '글 목록';    
            html += `
            <h2>글쓴이: ${author}</h2>
            <a href="/board/${id}"><h1>${subject}</h1></a>
            <hr>
            `
            
            }
            response.send(html);
        }

    });
}); 

function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

router.get('/:id', function (request, response) {
    if (!authCheck.isOwner(request, response)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
        response.send(`<script type="text/javascript">alert("로그인부터 하셔야죠!!"); 
                document.location.href="/auth/login";</script>`);
        
       return false;
    }
    const id = request.params.id;


    db.query('SELECT * FROM posttable WHERE id = ?', [id], function(err, results, fields){
      if(err){
          console.log(err);
          return false;
        } else {
            var html = `
            <h2>글쓴이: ${results[0].author}</h2>
            <h1>${results[0].subject}</h1>
            <h3>${escapeHtml(results[0].content)}</h3>`

            if (results[0].filedir) {
              var filedir = results[0].filedir;
              console.log(filedir);
              html += `
                <div>
                <img src="../../uploads/${filedir}.jpeg">
                  </div>
              `
            }
            html += `
            <hr>
            <a href="/">메인 화면</a> | <a href="/board">글 목록</a> | <a href="/comment/${id}">댓글 보기</a>
            
            `
            
            var realid = request.session.nickname; //현재 로그인된 아이디 정보
            if (realid == results[0].realid) html += `| <a href="/board/${results[0].id}/update">글 수정하기</a>
            <form action="/board/${id}/delete_process" method="post">
            <p><input class="btn" type="submit" value="글 삭제"></p>
            </form>
            `
            
            response.send(html);
        }

    });
});

router.get('/:id/update', function (request, response) {
       
        if (!authCheck.isOwner(request, response)) {  // 로그인 안되어있으면 로그인 페이지로 이동시킴
            response.send(`<script type="text/javascript">alert("로그인부터 하셔야죠!!"); 
            document.location.href="/auth/login";</script>`);
            console.log("제발요"); 
            return false;
        }
        const id = request.params.id;
        db.query('SELECT * FROM posttable WHERE id = ?', [id], function(err, rows, fields){ //현재 로그인된 아이디와 글쓴이의 아이디가 일치한지 확인
            if (request.session.nickname != rows[0].realid) {
                response.send(`<script type="text/javascript">alert("잘못된 접근이다 자시가");
                document.location.href="/board";</script>`);
    
                return false;
            } else {
            var author = rows[0].author;
              var subject = rows[0].subject;
              var content = rows[0].content;
                var title = '글 수정';
                var html = template.HTML(title,`
                        <h2>글 수정</h2>
                        <form action="/board/${id}/update_process" method="post">
                        <p><input type="username" name="username" value="${author}"></p>
                        <p><input type="subject" name="subject" value="${subject}"></p>
                        <p><input type="content" name="content" value="${content}"></p>
                        <p><input class="btn" type="submit" value="글 수정"></p>
                        </form>
                    `, '');
                response.send(html);
            }
        });



  });

router.post('/:id/update_process', function(request, response) {    
    var subject = request.body.subject;
    var content = request.body.content;    
    var username = request.body.username; 
    const id = request.params.id;

    if (subject && content && username) {
        
            if (subject.length < 50 && content.length < 250 && username.length < 50) {
                var sql = 'UPDATE posttable SET subject=?, content=?, author=? WHERE id=?';
                var params = [subject, content, username, id];
                db.query(sql, params, function (error, data) {
                    if (error) throw error;
                    response.send(`<script type="text/javascript">alert("글 수정이 완료되었습니다!");
                    document.location.href="/board";</script>`);
                });
            } else {
              response.send(`<script type="text/javascript">alert("제목은 50자, 내용은 250자까지 입력 가능합니다."); 
                document.location.href="/board/${results[0].id}/update";</script>`); 
            }           
    } else {
      response.send(`<script type="text/javascript">alert("이름, 제목, 내용을 모두 입력하세요."); 
                document.location.href="/board/${results[0].id}/update";</script>`); 
    }
  });


  router.post('/:id/delete_process', function(request, response) {    
    const id = request.params.id;
    var filedir ='';
    var path = '';
    db.query('SELECT * FROM posttable WHERE id = ?', [id], function(error, rows, fields) {
      if (error) throw error;
      filedir = rows[0].filedir;
      path = 'uploads/' + filedir;
      
  });


    var sql = 'DELETE FROM posttable WHERE id = ?';
    var params = [id];
    db.query(sql, params, function (error, data) {
        if (error) throw error;
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }

        response.send(`<script type="text/javascript">alert("글 삭제가 완료되었습니다!");
        document.location.href="/board";</script>`);
    });
  });


module.exports = router;