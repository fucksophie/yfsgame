const ws = new WebSocket(location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "ws://192.168.1.125:8000" : "wss://api-game.yourfriend.lv");
let users = [];
let user = "";

function drawTile(id, location) {
    const ussr = users.find(e => e.id == id);
    const tile = document.getElementById(`x${location.x}y${location.y}`);

    if (user == id) {
        tile.style.backgroundColor = "red"
        tile.style.color = "white"
    }
    
    tile.title = ussr.food+""
    tile.innerText = ussr.name;
}

function clearTile(location) {
    const tile = document.getElementById(`x${location.x}y${location.y}`);
    tile.removeAttribute('style')
    tile.innerText = "";
}

ws.addEventListener("open", () => {
    console.log('cnn')
})

document.addEventListener("keydown", event => {
    if (event.which == '40' || event.which == '83') {
        ws.send(JSON.stringify({
            type: "move",
            location: "down"
        }))
    }
    if (event.which == '38' || event.which == '87') {
        ws.send(JSON.stringify({
            type: "move",
            location: "up"
        }))
    }
    if (event.which == '37' || event.which == '65') {
        ws.send(JSON.stringify({
            type: "move",
            location: "left"
        }))
    }
    if (event.which == '39' || event.which == '68') {
        ws.send(JSON.stringify({
            type: "move",
            location: "right"
        }))
    }
    if(event.which == '82') {
        const ussr = users.find(e => e.id == user);

        if(ussr.drawing) {
            ws.send(JSON.stringify({
                type: "stopDrawing",
            }))
            return;
        }
        ws.send(JSON.stringify({
            type: "startDrawing",
        }))
    }
})

ws.addEventListener("message", msg => {
    const json = JSON.parse(msg.data);
    console.log(json)
    if(json.type == "warning") {
        alert(json.message)
    }
    if (json.type == "map") {
        json.map.forEach((y, yi) => {
            const tr = document.createElement("tr")
    
            y.forEach((x, xi) => {
                const td = document.createElement("td");
                if(x == "food") {
                    td.style.backgroundColor = "yellow"
                    td.innerText = "food"
                } 
                td.id = `x${xi}y${yi}`
                
                tr.appendChild(td);
            });
    
            document.getElementById("map").appendChild(tr);
        });
    }

    if (json.type == "join") {
        users.push(json.user);

        drawTile(json.user.id, json.user.location);
    }

    if(json.type == "startDrawing") {
        const ussr = users.find(e => e.id == json.id);

        ussr.drawing = true;
    }
    if(json.type == "stopDrawing") {
        const ussr = users.find(e => e.id == json.id);

        ussr.drawing = false;
    }
    if(json.type == "food") {
        const tile = document.getElementById(`x${json.location.x}y${json.location.y}`);
        
        tile.style.backgroundColor = "yellow"
        tile.innerText = "food"
    }
    if (json.type == "move") {
        const ussr = users.find(e => e.id == json.id);
        
        clearTile(ussr.location)

        if(ussr.drawing) {
            const tile = document.getElementById(`x${ussr.location.x}y${ussr.location.y}`);
            if(ussr.food == 100) {
                tile.style.backgroundColor = "red"
            } else if(ussr.food >= 80) {
                tile.style.backgroundColor = "green"
            } else if(ussr.food >= 60) {
                tile.style.backgroundColor = "blue"
            }  else if(ussr.food >= 30) {
                tile.style.backgroundColor = "aqua"
            } else if(ussr.food >= 10) {
                tile.style.backgroundColor = "pink"
            } else {
                tile.style.backgroundColor = "grey"
            }

            const loc = {...ussr.location}
            setTimeout(() => {
                clearTile(loc)
                const u55r = users.find(e => e.id == user);

                drawTile(u55r.id, u55r.location)

            }, ussr.food*100)
        }

        ussr.location = json.location;
        clearTile(ussr.location)

        drawTile(json.id, json.location);

    }
    
    if(json.type == "update") {
        const ussr = users.find(e => e.id == json.user.id);
        ussr.name = json.user.name;
        ussr.food = json.user.food;
    }

    if (json.type == "bye") {
        clearTile(users.find(e => e.id == id).location);
        users = users.filter(e => e.id != json.id);
    }

    if (json.type == "users") {
        users = json.users;

        users.forEach(u => {
            drawTile(u.id, u.location)
        })
    }
    
    if (json.type == "hi") {
        user = json.user.id;

        drawTile(json.user.id, json.user.location)
    }

})
