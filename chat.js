const socketConn = io('http://localhost:8000')
const messageContainer = document.getElementById('messageContainer')
const formElement = document.getElementById('form')
const formInput = document.getElementById('form-input')

socketConn.on('connection-message', message => {
    addMessage(message)
})


socketConn.on('broadcast-message', message => {
    addMessage(message)
})

formElement.addEventListener('submit', e => {
    e.preventDefault();
    const mesasge = formInput.value;
    socketConn.emit('chat-message',mesasge); 
    formInput.value = '';
})

function addMessage(message){
    var messageElement = document.createElement('div');
    messageElement.innerHTML = '<div class="message-box">'+message+'</div>';
    messageContainer.append(messageElement);
}