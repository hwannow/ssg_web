module.exports = {
    isOwner: function (request, response) {
      if (request.session.is_logined) {
        return true;
      } else {
        return false;
      }
    },
    statusUI: function (request, response) {

        var authStatusUI = '로그인후 사용 가능합니다 | <a href="/auth/login">로그인</a> | <a href="/auth/register">회원가입</a>'
        if (this.isOwner(request, response)) {
          authStatusUI = `${request.session.nickname}님 환영합니다 | <a href="/board">글 목록</a> | <a href="/auth/logout">로그아웃</a>`;
        }
        return authStatusUI;

    }
  }