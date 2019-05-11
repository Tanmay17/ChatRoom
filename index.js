const app = require('express')();
var http = require('http').createServer(app);
const io = require('socket.io').listen(http);
const uuidv1 = require('uuid/v1');
const sqlite3 = require('sqlite3').verbose();

//DB setup
var db = new sqlite3.Database('relation.db', (err)=>{
    if(err) console.error(err.message);
    console.log("Connection with in-memory DB is succesfully made");
    //Creating Table on start of server
    db.serialize(()=> {
        db.run('CREATE TABLE IF NOT EXISTS relations (id TEXT, ip TEXT, num TEXT, roman TEXT)');
    });
});

//Creating Routes
app.get('/', (req, res) => {
    
    // db.run("INSERT into relations VALUES (?,?,?)", ['2','IP','3'], (err)=>{
    //     if(err) console.log(err.message)
    // });
    
    res.sendfile(__dirname + '/index.html');
}); 

//IO Connections
io.on('connection', (socket) => {
    console.log('A User connected');
    let pass = true;
    let address = socket.handshake.address;
    let getIP = (address)=> {
        return address.slice(7);
    }
    console.log(getIP(address))
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
        if(msg.match(/==/g)){
            let arrMsg = msg.split('==');
            //if int
            if(arrMsg[0].match(/^[0-9]+$/) != null){
                db.all("SELECT * FROM relations WHERE ip=? AND num=?", [getIP(address), arrMsg[0]], (err, rows)=> {
                    //Replace Values
                    console.log(rows)
                    rows.forEach((row)=>{
                        db.run("DELETE FROM relations WHERE id=?", [row.id], (err)=>{
                            if(err) console.log(err.message);
                        });
                    });
                });
                db.run("INSERT into relations VALUES (?,?,?,?)", [uuidv1(), getIP(address), arrMsg[0] , arrMsg[1]], (err)=>{
                    if(err) console.log(err.message);
                    console.log("New relation Added");
                }); 
            }else{
                db.all("SELECT * FROM relations WHERE ip=? AND roman=?", [getIP(address), arrMsg[0]], (err, rows)=> {
                    console.log(rows)                    
                    //Replace Values
                    rows.forEach((row)=>{
                        db.run("DELETE FROM relations WHERE id=?", [row.id], (err)=>{
                            if(err) console.log(err.message);
                        });
                    });
                });
                db.run("INSERT into relations VALUES (?,?,?,?)", [uuidv1(), getIP(address), arrMsg[1], arrMsg[0]], (err)=>{
                    if(err) console.log(err.message);
                    console.log("New relation Added");
                }); 
            }
        }else{
            //Getting all the data
            if(msg.match(/^[0-9]+$/) != null){
                db.all("SELECT * FROM relations WHERE ip=? AND num=?", [getIP(address), msg], (err, rows)=> {
                    rows.forEach((row)=>{
                        io.emit('chat message', row.roman); 
                    });
                    pass = false;
                });
                response = intToRoman(msg);
            }else{
                db.all("SELECT * FROM relations WHERE ip=? AND roman=?", [getIP(address), msg], (err, rows)=> {
                    rows.forEach((row)=>{
                        io.emit('chat message', row.num); 
                    });
                    pass = false;
                });
                response = romanToInt(msg);
            }

            //Broadcasting msg to all clients in socket
            if(pass) io.emit('chat message', response);  
        }
    });

    socket.on('disconnect', ()=>{
        console.log("A User Disconnect");
    })
});


//Server Config
http.listen(process.env.PORT || 3000 , ()=>{
    console.log("Server is running");
});