import fetch from "node-fetch";
import { exec } from "child_process";

const url = "https://nordvpn.com/api/server";
const options = {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "cross-site",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    },
    "referrerPolicy": "no-referrer-when-downgrade",
    "credentials": "include",
    "method": "GET"
  };

let availableServers = [];

let switchDelay = 5*60*1000;
let updateDelay = 6*switchDelay;

const sleep = function (ms){
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}



const updateServerList = async function() {
    console.log("Updating server list...");
    try{
        let result = await fetch(url, options);
        result = await result.json();
        if(result){
            result = result.filter(entry => { 
                return entry.country == "United States"
            }).map(entry => entry.name);
            availableServers = result;
        }
    }catch(err){
        console.log(err);
    }
    
    
    console.log(`New List Size: ${availableServers.length}`);
    await sleep(updateDelay);
    updateServerList();
}

const runNordCmd = async function(serverName){
    exec(`nordvpn -c -n "${serverName}"`, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

const switchServer = async function(){
    if(availableServers.length > 0){
        const randomServer = availableServers[Math.floor(Math.random()*availableServers.length)];
        console.log(`Switching Server to ${randomServer}`);
        runNordCmd(randomServer);
    }else{
        console.log("No servers available...");
    }

    await sleep(switchDelay);
    switchServer();
}


const main = async function(){
    updateServerList();
    await sleep(5000);
    await switchServer();
}


main();
