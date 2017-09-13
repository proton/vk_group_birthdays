var VK_API_VERSION = '5.61';

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
    group_info: null
  },
  watch: {
    url: function() { this.updateData(); }
  },
  created: function() { this.updateData(); },
  methods: {
    resetData: function() {
      this.users = [];
      this.group_info = null;
    },
    updateData: function() {
      if (this.urlInvalid()) this.resetData();
      else {
        this.loadGroupInfo();
      }
    },
    urlInvalid: function() {
      var domain = 'https://vk.com/';
      if(_.startsWith(this.url, domain)) {
        return false;
      }
      return true;
    },
    loadGroupInfo: function() {
      var self = this;
      var domain = 'https://vk.com/';
      var group_id = this.url.slice(domain.length);
      console.log(group_id);
      VK.Api.call('groups.getById', { group_id: group_id, fields: 'members_count, photo_50', v: VK_API_VERSION }, function(r) {
        if(r.response) {
          self.group_info = r.response[0];
          //

          // $('.group_info')
          // .html('<img src="' + r.response[0].photo_50 + '"/><br/>' 
          //   + r.response[0].name
          //   + '<br/>Участников: ' + r.response[0].members_count);
          // getMembers20k(group_id, r.response[0].members_count); // получаем участников группы и пишем в массив membersGroups
        }
        else self.resetData();
      });
    }
  }
})