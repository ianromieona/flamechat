var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io=require('socket.io').listen(server),
    userTyping = [],
    users= {};

server.listen(3000);
app.get('/',function(req,res){
    res.sendfile(__dirname + "/index.html");
});
app.use("/css", express.static(__dirname + '/css'));
io.sockets.on('connection', function(socket){
    socket.on('typing',function(data,callback){
        if(socket.nickname in userTyping){
            callback(false);
        }else{
            callback(true);
//            socket.nickname = data;
            userTyping[socket.nickname]= socket.nickname;
            updateTyper()  
        }
    })
    socket.on('new user',function(data,callback){
        if(data in users){
            callback(false);
        }else{
            callback(true);
            socket.nickname = data;
            users[socket.nickname]= socket;
            updateNicknames()
        }    
    })
    function updateNicknames(){
        io.sockets.emit('usernames',Object.keys(users));
    }
    function updateTyper(){
        io.sockets.emit('typings',Object.keys(userTyping)); 
    }
    socket.on('send message',function(data, callback){
        var msg = data.trim();
        if(msg.substr(0,3) === '/w '){
            msg = msg.substr(3);
            var index = msg.indexOf(' ');
            if(index !== -1 ){
                var name = msg.substring(0,index);
                var msg = msg.substring(index + 1);
                if(name in users){
                    users[name].emit('whisper',{msg:msg,nick: socket.nickname});
                }else{
                    callback("Error.Enter valid user.")  
                }
            }else{
                callback("Error.Please enter message.")
            }
        }else{
            if(socket.nickname in userTyping){
                delete userTyping[socket.nickname];
            }
            console.log(userTyping)
            updateTyper()
            io.sockets.emit('new message',{msg:msg,nick: socket.nickname});
        }
    }); 
    
    socket.on('disconnect',function(data){
        if(!socket.nickname) return;
        delete users[socket.nickname];
        updateNicknames()
        
    });
});