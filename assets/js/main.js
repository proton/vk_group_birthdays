function auth() {
  VK.Auth.getLoginStatus(function(response) {
    if (!response.session) {
      VK.Auth.login(function(response) {
        if (response.session) {
          console.log("ok");
          if (response.settings) {
            console.log(response.settings);
          }
        } else {
          alert("Это был неправильный выбор");
        }
      });
    }
  });
}
VK.init({ apiId: 6183713 });
auth();

var app = new Vue({
  el: '#app',
  data: {
    url: 'https://vk.com/s1ovesnik',
    users: [],
    urlInvalid: function() {
      var domain = 'https://vk.com/';
      if(_.startsWith(this.url, domain)) {
        return false;
      }
      return true;
    }
  }
})