define(['libs/store'], function (store) {
    return {
        randomString: function () {
            return Math.random().toString(36).substring(7);
        },
        declOfNum: function (number, titles) {
            var cases = [2, 0, 1, 1, 1, 2];
            return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
        },
        isEmpty: function (str) {
            return (!str || str.length === 0 || /^\s*$/.test(str));
        },
        isLength: function (str, min, max) {
            return str.length >= min && str.length <= max;
        },
        isAlphanumeric: function (str) {
            return (/^[a-zа-я0-9\s]+$/i).test(str);
        },
        parseUrl: function(str) {
            return str.replace(/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/, '<a href="$&" target="_blank">$&</a>');
        },
        deferChecker: function(callback, test, failback, limit, speed) {
            if (typeof failback !== 'function') {
                failback = function() {};
            }

            if (typeof limit !== 'number') {
                limit = 10;
            }

            if (typeof speed !== 'number') {
                speed = 10;
            }

            var interval = setInterval(function() {
                limit--;

                if (limit <= 0) {
                    clearInterval(interval);
                    return failback();
                }

                var result = test();

                if (result !== false) {
                    clearInterval(interval);
                    callback(result);
                }
            }, speed);
        },
        objectEquals: function(a, b) {
            if (!a || !b) {
                return false;
            }

            var p;
            
            for (p in a) {
                if (typeof(b[p]) === 'undefined') {
                    return false;
                }
            }

            for (p in a) {
                if (a[p]) {
                    switch (typeof(a[p])) {
                        case 'object':
                            if (!a[p].equals(b[p])) {
                                return false;
                            }
                            break;
                        case 'function':
                            if (typeof(b[p]) === 'undefined' || (p !== 'equals' && a[p].toString() !== b[p].toString())) {
                                return false;
                            }
                            break;
                        default:
                            if (a[p] !== b[p]) {
                                return false;
                            }
                    }
                } else {
                    if (b[p]) {
                        return false;
                    }
                }
            }

            for (p in b) {
                if (typeof(a[p]) === 'undefined') {
                    return false;
                }
            }

            return true;
        },
        prepareMessage: function(message) {
            delete message.type;
            delete message.data;
            delete message.repeatName;
            delete message.getText;
            delete message.formattedTime;
            delete message.formattedName;

            return message;
        },
        findUserByName: function(list, name) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].name === name) {
                    return i;
                }
            }

            return -1;
        },
        findUserByUuid: function(list, uuid) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].uuid === uuid) {
                    return i;
                }
            }

            return -1;
        },
        validateUserName: function(utils, name) {
            if (utils.isEmpty(name)) {
                return 'Имя не заполнено';
            }

            if (!utils.isLength(name, 2, 20)) {
                return 'Допустимая длинна имени от 2 до 20 символов';
            }

            if (!utils.isAlphanumeric(name)) {
                return 'Допускаются только буквы и цифры';
            }
        },
        saveUserChannel: function(hashModel, userModel) {
            store.set(hashModel.channelId(), {
                user: {
                    id: userModel.id(),
                    name: userModel.name(),
                    paramAudio: userModel.paramAudio(),
                    paramExit: userModel.paramExit()
                }
            });
        },
        imageScale: function(maxW, maxH, srcW, srcH) {
            var ratio = 0;
            var resultSize = { w: srcW, h: srcH };

            if (srcW > maxW){
                ratio = maxW / srcW;

                resultSize.w = maxW;
                resultSize.h = srcH * ratio;

                srcH = srcH * ratio;
                srcW = srcW * ratio;
            }

            if (srcH > maxH) {
                ratio = maxH / srcH;

                resultSize.h = maxH;
                resultSize.w = srcW * ratio;
            }

            resultSize.w = Math.round(resultSize.w);
            resultSize.h = Math.round(resultSize.h);

            return resultSize;
        }
    };
});