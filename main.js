const http = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');

const url = 'https://www.3dbuzz.com/';

http(url).then(
    async (response)=>{
        const html = response.data;

        const $ = cheerio.load(html);
        const group = $('.c-series').nextAll();

        if(!fs.pathExists('./zips'))
            fs.mkdirSync('./zips');


        let urlsToGet = [];

        for(let i = 0; i < group.length; i++)
        {
            const item = $(group[i]).find('ol');
    
            item.children().each(function(){
    
                urlsToGet.push($(this).find('a').attr('href'));
            })
        }
        
        for(let i = 0; i < urlsToGet.length; i++)
        {
            const url = urlsToGet[i];
            const name = url.split('/').pop();
            
            try
            {
                await attemptZipGrab(name, url);
            }
            catch(err)
            {
                console.log(err);
            }
        }


    },
).catch(console.error);

function sleep(ms)
{
    return new Promise(resolve=>{
        setTimeout(resolve, ms);
    })
}
function attemptZipGrab(name, url)
{
    const maxAttempts = 10;
    return new Promise(async (res, rej)=>{
        let attempt = 0;
        let stopRunning = false;

        if(fs.existsSync('./zips/'+name))
        {
            console.log(`---- ${name} has already been collected ----`);
            return res();
        }

        while(!stopRunning)
        {
    
            console.log(`Getting ${name} attempt ${attempt} of ${maxAttempts}\n`);

            await http.get(url, {responseType:'arraybuffer'}).then((response)=>
                {
                    fs.outputFileSync('./zips/'+name, response.data);

                    console.log(`----- GOT ${name} -------`)

                    stopRunning = true;
                    res();
                }
            ).catch(
                async (error)=>{
                    await sleep(1000);
                    attempt++;
                    if(attempt >= maxAttempts)
                    {
                        console.log(`Attempt for ${name} has failed.\n`);
                        stopRunning = true;
                    }
                }
            )
        }
        rej();
    });
}
