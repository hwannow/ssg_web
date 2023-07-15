var express = require('express');
var router = express.Router();

router.get('/', function (request, response) {
    var html = `
    <script>
   var pos=document.URL.indexOf("text=")+5;
   document.write(decodeURIComponent(document.URL.substring(pos)));
</script>
    `
    response.send(html);
});



module.exports = router;