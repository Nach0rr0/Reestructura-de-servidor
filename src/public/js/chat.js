const socket = io();

let nombre = '';
async function pedirEmail() {
  const { value: nombre } = await Swal.fire({
    title: 'Enter your mail',
    input: 'email',
    inputLabel: 'Your mail',
    inputValue: '',
    showCancelButton: false,
    inputValidator: (value) => {
      if (!value) {
        return 'You need to write mail!';
      }
    },
  });

  correoDelUsuario = nombre;
}
pedirEmail();

const chatBox = document.getElementById('chat-box');
chatBox.addEventListener('keyup', ({ key }) => {
  if (key == 'Enter') {
    socket.emit('msg_front_to_back', {
      user: correoDelUsuario,
      message: chatBox.value,
    });
    chatBox.value = '';
  }
});

socket.on('msg_back_to_front', (msgs) => {
  console.log(msgs);
  let msgsFormat = '';
  msgs.forEach((msg) => {
    msgsFormat += `<div class='linea'>`;
    msgsFormat += `<h5>${msg.user}</h5>`;
    msgsFormat += `<p>${msg.message}</p>`;
    msgsFormat += `</div>`;
  });
  const message = document.getElementById('message');
  message.innerHTML = msgsFormat;
});
