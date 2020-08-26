const mysql = require('mysql'); 
const conn = require('socket.io')(8000)


const dbConn = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:'chatbot'
})
dbConn.connect(function(err){
    if(err) throw err;
    console.log('connected to chatbot DB')
})

messageData = {}

conn.on('connection',socket => {
    socket.emit('connection-message','Welcome to FinChatBot, How can we help you today?')
    logMessages('new_user',socket.id)
    socket.on('chat-message', chatMessage => {
        
        //*** write message back to client screen
        socket.emit('broadcast-message','<b>You:</b> '+chatMessage)

        messageData['user_message']=chatMessage;
        messageData[socket.id]="Sipho";
        messageData['user_id']=socket.id;

        //*** call string checker function
        var botResponse = aggregateMessage(messageData)
        //*** save messages to the db
        logMessages('user_message',botResponse)

        socket.emit('broadcast-message',botResponse.bot_message)
    })

    socket.on('disconnect',()=>{
        socket.emit('drop_off',socket.id)
        console.log('drop_off: '+socket.id)
        logMessages('drop_off',socket.id)
        delete socket.id
    })
})

function aggregateMessage(messageData){
    var response = {}
    response['user_message']=messageData.user_message;
    response['user_id']=messageData.user_id;
    if(messageData.user_message.includes("balance")){
        response['bot_message'] = `Sure ${messageData[messageData.user_id]}, you have R2 000 in your
        savings account`
    }
    else if(messageData.user_message.includes("No")) {
        response['bot_message'] = 'Great, come back soon!'
    }
    else{
        response['bot_message'] = 'How else can I help you?'
    }
    
    return response
}

//*** messageData can either recieve a string or object,
//*** depending on the log type (new_user, user_message or drop_off)
function logMessages(type,messageData){
    if(type=='new_user'){
        console.log('new user logged id: '+messageData);
        var sql = "insert into users(user_id) VALUES (?)";
        var values = [messageData];
        dbConn.connect(function(err){
            dbConn.query(sql,[values], function (err, result) {
                if (err) throw err;
              });
        })
    }
    else if(type=='user_message'){
        var sql = "insert into chat_messages(user_id,message,response) VALUES (?)";
        var values = [messageData.user_id, messageData.user_message, messageData.bot_message];
        dbConn.connect(function(err){
            dbConn.query(sql,[values], function (err, result) {
                if (err) throw err;
              });
        })
    }
    else{ //*** drop_offs
        dbConn.connect(function(err){
            var sql = "update users set dt_dropoff=now() where user_id = ?";
            var values = [messageData];
            dbConn.query(sql,[values], function (err, result) {
                if (err) throw err;
              });
        })
    }

}