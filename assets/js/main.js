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

VK.init({ apiId: 6183713 });
auth();

var app = new Vue({
  el: '#app',
  data: {
    domain: 'https://vk.com/',
    url: 'https://vk.com/s1ovesnik',
    users: [],
    group_info: null
  },
  computed: {
    sortedUsers: function() {
      return _.orderBy(this.users, ['next_bdate'], ['asc']);
    },
    progress: function() {
      if (!this.group_info) return 100;
      if (!this.group_info.members_count) return 100;
      return this.users.length * 100 / this.group_info.members_count;
    }
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
      if(_.startsWith(this.url, this.domain)) {
        return false;
      }
      return true;
    },
    formatDate(date) {
      if (!date) return '';
      return date.toLocaleString('ru', { month: 'long', day: 'numeric' } );
    },
    loadGroupInfo: function() {
      var self = this;
      var group_id = this.url.slice(self.domain.length);
      VK.Api.call('groups.getById', { group_id: group_id, fields: 'members_count, photo_100', v: VK_API_VERSION }, function(r) {
        if(r.response) {
          self.group_info = r.response[0];
          if (self.group_info.members_count) self.loadGroupMembers();
        }
        else self.resetData();
      });
    },
    loadGroupMembersApiRequest: function(group_id, count, offset) {
      var fields = 'photo_50, photo_400_orig, universities, bdate';
      return 'API.groups.getMembers({"group_id": ' + group_id + ', "v": ' + VK_API_VERSION + ', "sort": "id_asc", "fields": "' + fields + '", "count": "' + count + '", "offset": ' + offset + '}).items';
    },
    loadGroupMembers: function() {
      // (c) https://habrahabr.ru/post/248725/
      var self = this;
      var group_id = self.group_info.id;
      var members_count = self.group_info.members_count;
      var offset = 10;
      var code =  'var members = ' + self.loadGroupMembersApiRequest(group_id, offset, self.users.length) + ';' // делаем первый запрос и создаем массив
      + 'var offset = '+offset+';' // это сдвиг по участникам группы
      + 'while (offset < '+ 20*offset + ' && (offset + ' + self.users.length + ') < ' + members_count + ')' // пока не получили 20000 и не прошлись по всем участникам
      + '{'
        + 'members = members + ' + self.loadGroupMembersApiRequest(group_id, offset, self.users.length + ' + offset') + ';' // сдвиг участников на offset + мощность массива
        + 'offset = offset + '+offset+';' // увеличиваем сдвиг на 1000
      + '};'
      + 'return members;'; // вернуть массив members
  
      VK.Api.call("execute", {code: code}, function(r) {
        if (r.response) {
          var new_users = r.response.forEach(function(u) { u.next_bdate = calculateNextBirthday(u.bdate); })
          self.users = self.users.concat(r.response); // запишем это в массив
          if (members_count >  self.users.length) // если еще не всех участников получили
            setTimeout(function() { self.loadGroupMembers(); }, 333); // задержка 0.333 с. после чего запустим еще раз
        } else {
          console.log(data.error.error_msg);
          self.resetData();
        }
      });
    }
  }
})