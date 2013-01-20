define(['compiled/templates', 'libs/modernizr', 'libs/bootstrap', 'libs/jquery', 'libs/jquery.spin', 'libs/knockout', 'libs/hasher', 'libs/jstorage', 'libs/moment', 'app/utils', 'app/commands', 'models/pubnub', 'libs/visibility', 'models/chat', 'models/hash', 'models/user', 'models/message'],

function (Templates, modernizr, $bootstrap, $, $spin, ko, hasher, jstorage, moment, utils, commands, pubnub, Visibility, chatModel, hashModel, userModel, MessageModel) {
    'use strict';

    $('#loader').spin();

    var pubnubParams = {
        restore: false,
        pubkey: 'pub-6cabf426-7367-47cc-b60c-0fc6c67d2665',
        subkey: 'sub-f0a158e6-0e58-11e2-8231-7fb88e9a4259',
        ssl: true
    };

    var parseMessage = function (jsonMessage, callback) {
        try {
            jsonMessage = JSON.parse(jsonMessage);
        } catch (e) {
            return;
        }

        if (!jsonMessage.time || !jsonMessage.text || !jsonMessage.name) {
            return;
        }

        if (utils.isEmpty(jsonMessage.text)) {
            return;
        }

        var message = new MessageModel();
        var time = moment.unix(jsonMessage.time);

        if (time.isValid()) {
            message.time(time);
        }

        message.text(jsonMessage.text);

        if (utils.isEmpty(jsonMessage.name)) {
            jsonMessage.name = 'Неизвестный';
        }

        if (message.type() === 'system') {
            if (utils.objectEquals(jsonMessage, chatModel.lastSystemMessage())) {
                return;
            }
            
            message.name(jsonMessage.name);
            callback(message);
            return;
        }

        if (utils.objectEquals(jsonMessage, chatModel.lastMessage())) {
            message.name(message.repeatName);
        } else {
            message.name(jsonMessage.name);
        }

        callback(message);
    };

    var pubnubDispatcher = {
        callback: function (jsonMessage) {
            parseMessage(jsonMessage, function (message) {
                if (message.type() === 'text') {
                    chatModel.messages.push(message);
                    chatModel.scrollToBottom();
                    return;
                }

                if (message.type() === 'system') {
                    commands(message.data().cmd, message.data().args, message);
                }
            });
        },
        disconnect: function () {
            chatModel.isReady(false);
        },
        reconnect: function () {
            if (!chatModel.isReady()) {
                chatModel.isReady(true);
            }
        },
        connect: function () {
            pubnubModel.pubnub.history({
                channel: pubnubModel.channel(),
                limit: 100,
                error: function() {
                    if (console) {
                        console.log('history error');
                    }
                }
            }, pubnubModel.historyHandler(function(message) {
                parseMessage(message, function (message) {
                    if (message.type() !== 'text') {
                        return;
                    }

                    chatModel.messages.push(message);
                    chatModel.scrollToBottom();       
                });
            }));

            pubnubModel.pubnub.here_now({
                channel: pubnubModel.channel(),
                callback: function(event) {
                    if (userModel.name() === userModel.defaultName) {
                        userModel.name(userModel.defaultName + ' ' + (event.occupancy === 0 ? 1 : event.occupancy + 1).toString());
                    }
                }
            });

            chatModel.isReady(true);
        },
        presence: function (event) {
            chatModel.usersOnline(event.occupancy);
        }
    };

    var pubnubModel = pubnub(pubnubParams, pubnubDispatcher);

    chatModel = chatModel(pubnubModel, userModel);

    commands = commands(chatModel, userModel);

    hashModel.userId.subscribe(function (newId) {
        userModel.id(newId.toString());
    });

    hashModel.channelId.subscribe(function (newChannel) {
        pubnubModel.channel(newChannel.toString());
    });

    userModel.paramAudio.subscribe(function (audio) {
        userModel.paramAudioText(audio ? 'выкл' : 'вкл');
        jstorage.set('user', {
            id: userModel.id(),
            paramAudio: userModel.paramAudio()
        });
    });

    hasher.prependHash = '';

    hasher.initialized.add(function (currentHash) {
        var savedUser = jstorage.get('user');

        if (savedUser) {
            try {
                savedUser = JSON.parse(savedUser);
            } catch (e) {
                savedUser = null;
                jstorage.flush();
            }
        }
        
        if (currentHash !== '') {
            hashModel.fullHash(currentHash);
            if (userModel.id() === '') {
                if (savedUser) {
                    hashModel.userId(savedUser.id);
                } else {
                    hashModel.userId(utils.randomString());
                }
            }
        } else {
            if (savedUser) {
                hashModel.userId(savedUser.id);
                hashModel.channelId(utils.randomString());
            } else {
                hashModel.userId(utils.randomString());
                hashModel.channelId(utils.randomString());
            }
        }

        if (savedUser) {
            userModel.id(savedUser.id);
            userModel.paramAudio(savedUser.paramAudio);
        }
    });

    hasher.init();
    hasher.replaceHash(hashModel.fullHash());

    jstorage.set('user', {
        id: userModel.id(),
        paramAudio: userModel.paramAudio()
    });

    pubnubModel.init();
    pubnubModel.subscribe();

    $(document).ready(function () {
        var MasterModel = function () {
            this.chatModel = chatModel;
            this.userModel = userModel;
        };

        var heightControl = function (currentHeight) {
            var heightOffset = $('.messagebox').outerHeight(true) - $('.messagebox').height() + $('.typing').outerHeight();
            var rows = $('.row');

            var complete = function(height) {
                chatModel.style({ height: height + 'px' });
            };

            rows.each(function(idx, element) {
                if (idx === 3) {
                    return;
                }

                utils.deferChecker(function (height) {
                    heightOffset += height;

                    if (idx === rows.length - 1) {
                        complete(currentHeight - heightOffset);
                    }
                }, function() {
                    var height = $(element).outerHeight(true);
                    return height > 0 ? height : false;
                });
            });
        };

        Visibility.change(function (e, state) {
            if (state === 'hidden') {
                return chatModel.isActive(false);
            }

            if (state === 'visible') {
                return chatModel.isActive(true);
            }
        });

        $(window).resize(function() {
            if (chatModel.isActive()) {
                heightControl($(window).height());
            }
        });

        chatModel.isReady.subscribe(function(isReady) {
            if (isReady) {
                heightControl($(window).height());
            }
        });

        $bootstrap('.main-buttons .invite').popover({
            trigger: 'manual',
            placement: 'left',
            html: true,
            title: 'Пригласить участника',
            content: Templates.invite({ link: hashModel.getLink() })
        });

        $('.main-buttons')
            .on('focus', '#share-link', function() {
                $(this).select();
            })
            .on('click', '.input-append', function(e) {
                $(e.currentTarget).find('input').select();
            })
            .on('mouseup', '#share-link', function(e) {
                e.preventDefault();
            });

        $bootstrap('.username h2').tooltip();

        ko.applyBindings(new MasterModel(), $('body').get(0));
    });
});