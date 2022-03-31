// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.132.0/http/mod.ts";
import { Collection } from "https://deno.land/x/harmony@v2.6.0/src/utils/collection.ts";

interface Location {
  x: number;
  y: number;
}

class User {
  id: string;
  name: string;
  location!: Location;
  ws!: WebSocket;
  drawing!: boolean;


  constructor(name: string, location: { x: number; y: number }, ws: WebSocket) {
    this.name = name;
    this.location = location;
    this.ws = ws;
    this.id = crypto.randomUUID();
  }

  sendPacket(type: string, packet: any) {
    this.ws.send(JSON.stringify({
      type,
      ...packet,
    }));
  }
}
const square = "15x15".split('x').map(e=>+e);

const map: (string | undefined)[][] = " ".repeat(square[0]).split(" ").map((_e) =>
  " ".repeat(square[1]).split(" ")
);
const users: Collection<string, User> = new Collection<string, User>();

const sendPacketToAll = (type: string, packet: any) =>
  users.forEach((e) => e.sendPacket(type, packet));


const findAvailableSquare = (): Location => {
  let lol;

  map.forEach((y, yi) => {
    y.forEach((x, xi) => {
      if (!x) lol = { x: xi, y: yi };
    });
  });
  return lol || { x: square[0], y: square[1] }; // bugs with this,,, !U ghh!~H!H!H!HY!HH!H!U*hyqwfir0d-ghsdffgipsdfg-[9sdhjufgph]
};

const findRandomAvailableSquare = (): Location => {
  const good: Location[] = [];

  map.forEach((y, yi) => {
    y.forEach((x, xi) => {
      if(x && y) return { x: square[0], y: square[1] };
      good.push({ x: xi, y: yi });
    });
  });

  return good[Math.floor(Math.random() * good.length)]
}
function reqHandler(req: Request) {
  
  if (req.headers.get("upgrade") != "websocket") {
    
    return new Response(null, { status: 501 });
  }
  const { socket: ws, response } = Deno.upgradeWebSocket(req);

  let id: string;

  ws.addEventListener("open", () => {
    if(users.size >= square[0]*square[1]) {
      
      ws.send(JSON.stringify({
        type: "warning", 
        message: "[ERROR] Game is full!"
      }))

      return ws.close(0);
    }

    const user = new User("0", findAvailableSquare(), ws);

    sendPacketToAll("join", {
      user,
    });

    users.set(user.id, user);

    id = user.id;

    user.sendPacket("map", {map});

    user.sendPacket("users", 
    { users: users.map(e => {return {id: e.id, location: e.location, name: e.name}})}
    );


    user.sendPacket("hi", {user});


    map[user.location.y][user.location.x] = user.id;
  });
  ws.addEventListener("message", message => {
      // proper parsing here
      
      // handle json errors

      const json = JSON.parse(message.data);
      const user = users.get(id);
      
      if(!user) return ws.close();

        if(json.type == "startDrawing") {
          sendPacketToAll("startDrawing", {
            id: user.id
          })
          user.drawing = true;
          users.set(user.id, user)
        }

        if(json.type == "stopDrawing") {
          sendPacketToAll("stopDrawing", {
            id: user.id
          })
          user.drawing = false;
          users.set(user.id, user)
        }

        if(json.type == "move") {
            const oldpos = {...user.location}; // {...} trick so we can make new obj

            if(json.location == "up") user.location.y -= 1;
            if(json.location == "down") user.location.y += 1;

            if(json.location == "left") user.location.x -= 1;
            if(json.location == "right") user.location.x += 1;

            if(user.location.x < 0 || user.location.y < 0 || user.location.y > square[0]
                || user.location.x > square[1]) {
                user.location = oldpos;
                
                return;
            } 

            if(map[user.location.y][user.location.x] == "food") {
              map[user.location.y][user.location.x] = "";
              if(user.name !== "100") {
                user.name = (+user.name)+1+""

              } 
              sendPacketToAll("update", {
                user
              });
            }

            if(map[user.location.y][user.location.x]) {
              user.location = oldpos;
              return;
            }
            map[oldpos.y][oldpos.x] = ''            
            map[user.location.y][user.location.x] = user.id;

            users.set(user.id, user)

            sendPacketToAll("move", {
                id: user.id, 
                location: user.location
            });
        }
  })

  ws.addEventListener("close", () => {
    const user = users.get(id);
    
    if(!user) return;

    map[user.location.y][user.location.x] = "";

    users.delete(id);   
    sendPacketToAll("bye", {
      id: user.id
    }) 
  });
  
  return response;
}

serve(reqHandler, { port: +(Deno.env.get("PORT") || 8000) });

console.log("started")

function makeFood() { // courtesy of Feenicks#6105
  if(users.size == 0) return;

  const location = findRandomAvailableSquare();

  map[location.y][location.x] = "food";

  sendPacketToAll("food", {location});

  setTimeout(makeFood, (Math.random() * 3000 + 2000)/Math.max(users.size, 1));
}

makeFood()
