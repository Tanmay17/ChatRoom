const app = require('express')();
var http = require('http').createServer(app);
const io = require('socket.io').listen(http);

//Creating Routes
app.get('/', (req, res) => {
    res.sendfile(__dirname + '/index.html');
}); 

//IO Connections
io.on('connection', (socket) => {
    console.log('an user connected');
    //Event
    socket.on('chat message', (msg) => {

        let roman_to_Int = (msg) => {
            if(msg == '') return -1;
            var num = char_to_int(msg.charAt(0));
            var pre, curr;
            for(var i = 1; i < msg.length; i++){
                curr = char_to_int(msg.charAt(i));
                pre = char_to_int(msg.charAt(i-1));
                if(curr <= pre){
                    num += curr;
                } else {
                    num = num - pre*2 + curr;
                }
            }
            return num;
        }

        let int_to_Roman = (msg) => {
            var lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1},roman = '',i;
            for ( i in lookup ) {
                while ( msg >= lookup[i] ) {
                    roman += i;
                    msg -= lookup[i];
                }
            }
            return roman;
        }

        let char_to_int = (c) =>{
            switch (c){
                case 'I': return 1;
                case 'V': return 5;
                case 'X': return 10;
                case 'L': return 50;
                case 'C': return 100;
                case 'D': return 500;
                case 'M': return 1000;
                default: return -1;
            }
        }

        let response;
        if(msg.match(/^[0-9]+$/) != null)
            response = int_to_Roman(msg);
        else 
            response = roman_to_Int(msg);
        
        //Broadcasting msg to all clients in socket
        if(response == -1)
            io.emit('chat message', msg);
        else
            io.emit('chat message', response);

    });
});

//Server Config
http.listen(process.env.PORT || 3000, ()=>{
    console.log("Server is running");
});