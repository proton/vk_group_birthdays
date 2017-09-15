var VK_API_VERSION = '5.61';
var VK_APP_ID = 6183713;

function calculateNextBirthday(birthday_string) {
  if (!birthday_string) return null;
  var birthday_arr = birthday_string.split('.');
  var day = +birthday_arr[0];
  var month = +birthday_arr[1] - 1;
  var now = new Date();
  var year = now.getFullYear();
  if (month < now.getMonth() || (month == now.getMonth() && day < now.getDate())) ++year;
  return new Date(year, month, day);
}

VK.init({ apiId: VK_APP_ID });

var app = new Vue({
  el: '#app',
  data: {
    domain: 'https://vk.com/',
    url: 'https://vk.com/s1ovesnik',
    users: [],
    group_info: null,
    vk_session: null
  },
  computed: {
    sortedUsers: function() {
      return _.orderBy(this.users, ['next_bdate'], ['asc']);
    },
    progress: function() {
      if (!this.group_info) return 100;
      if (!this.group_info.members_count) return 100;
      return this.users.length * 100 / this.group_info.members_count;
    },
    urlInvalid: function() {
      if(_.startsWith(this.url, this.domain)) {
        return false;
      }
      return true;
    }
  },
  watch: {
    url: function() { this.updateData(); }
  },
  created: function() {
    this.vkLoadSession();
  },
  methods: {
    resetData: function() {
      this.users = [];
      this.group_info = null;
    },
    updateData: function() {
      if (this.urlInvalid) this.resetData();
      else this.loadGroupInfo();
    },
    setVkSession: function(response) {
      this.vk_session = response.session;
      if (this.vk_session) this.updateData();
    },
    vkLoadSession: function() {
      VK.Auth.getLoginStatus(this.setVkSession);
    },
    vkAuth: function() {
      VK.Auth.login(this.setVkSession);
    },
    formatDate(date) {
      if (!date) return '';
      return date.toLocaleString('ru', { month: 'long', day: 'numeric' } );
    },
    loadGroupInfo: function() {
      var self = this;
      var group_id = this.url.slice(self.domain.length);
      VK.Api.call('groups.getById', { group_id: group_id, fields: 'members_count, photo_50', v: VK_API_VERSION }, function(r) {
        if(r.response) {
          self.group_info = r.response[0];
          if (self.group_info.members_count) self.loadGroupMembers();
        }
        else self.resetData();
      });
    },
    loadGroupMembers: function() {
      var self = this;
      var group_id = self.group_info.id;
      var members_count = self.group_info.members_count;
      var offset = 1000;
      var fields = 'photo_50, photo_400_orig, universities, bdate';

      var request_params = { group_id: group_id, fields: fields, v: VK_API_VERSION, sort: "id_asc", count: offset, offset: self.users.length };
      console.log(request_params);
      VK.Api.call('groups.getMembers', request_params, function(r) {
        if(r.response) {
          var new_users = r.response.items;
          new_users.forEach(function(u) { u.next_bdate = calculateNextBirthday(u.bdate); })
          self.users = self.users.concat(new_users);
          if (members_count >  self.users.length) setTimeout(function() { self.loadGroupMembers(); }, 333);
        } else {
          console.log(data.error.error_msg);
          self.resetData();
        }
      });
    }
  }
})