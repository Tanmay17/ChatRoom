const app = require('express')();
var http = require('http').createServer(app);
const io = require('socket.io').listen(http);
const sqlite3 = require('sqlite3').verbose();

//DB setup
var db = new sqlite3.Database('./Database/relation.db', sqlite3.OPEN_READWRITE, (err)=>{
    if(err) console.error(err.message);
    console.log("Connection with in-memory DB is succesfully made");
});

//Creating Routes
app.get('/', (req, res) => {
    
    db.serialize(()=> {
        // db.run('CREATE TABLE relations (num TEXT, roman TEXT)');
        var stmt = db.prepare("INSERT into relations VALUES ('1','I')");
        console.log(stmt)
        stmt.finalize();
        db.each("SELECT * FROM relations", function(err, row) {
            console.log(row. err);
        });
    });
    res.sendfile(__dirname + '/index.html');
}); 

//IO Connections
io.on('connection', (socket) => {
    console.log('A User connected');
    //Event
    socket.on('chat message', (msg) => {

        let romanToInt = (msg) => {
            if(msg == '') return -1;
            var num = charToInt(msg.charAt(0));
            var pre, curr;
            for(var i = 1; i < msg.length; i++){
                curr = charToInt(msg.charAt(i));
                pre = charToInt(msg.charAt(i-1));
                if(curr <= pre){
                    num += curr;
                } else {
                    num = num - pre*2 + curr;
                }
            }
            return num;
        }

        let intToRoman = (msg) => {
            var lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1},roman = '',i;
            for ( i in lookup ) {
                while ( msg >= lookup[i] ) {
                    roman += i;
                    msg -= lookup[i];
                }
            }
            return roman;
        }

        let charToInt = (c) =>{
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
            response = intToRoman(msg);
        else 
            response = romanToInt(msg);
        
        //Broadcasting msg to all clients in socket
        if(response == -1)
            io.emit('chat message', msg);
        else
            io.emit('chat message', response);

    });

    socket.on('disconnect', ()=>{
        console.log("A User Disconnect");
        // db.close((err)=>{
        //     if(err) console.error(err.message);
        //     console.log("DB connection is no more Available");
        // });
    })
});


//Server Config
http.listen(process.env.PORT || 3000, ()=>{
    console.log("Server is running");
});