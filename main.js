const http = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');

const url = 'https://www.3dbuzz.com/';

http(url).then(
    async (response)=>{
        const html = response.data;

        const $ = cheerio.load(html);
        const group = $('.c-series').nextAll();

        console.log(group.length);

        if(!fs.pathExists('./zips'))
            fs.mkdirSync('./zips');


        let urlsToGet = [];

        for(let i = 0; i < group.length; i++)
        {
            const item = $(group[i]).find('ol');
            
            console.log(item.children().length);

            item.children().each(function(){
                console.log($(this).find('a').attr('href'));
                urlsToGet.push($(this).find('a').attr('href'));
            })

            // for(let x = 0; x < item.children().length; x++)
            // {
                
            //     const child = $(item.children()[x].find('a'));
            //     console.log(child.text());
            // }

            // // console.log(item.text());

            // continue;

            // const url = item.children().find('a').attr('href');
            // if(url == null)
            //     continue;
           
        }
        
        console.log(urlsToGet.length);
        
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
        let success = false;
        while(!success)
        {
            console.log(`Getting ${name} attempt ${attempt} of ${maxAttempts}\n`);

            await http.get(url, {responseType:'arraybuffer'}).then((response)=>
                {
                    fs.outputFileSync('./zips/'+name, response.data);

                    console.log(`----- GOT ${name} -------`)

                    success = true;
                    res();
                }
            ).catch(
                async (error)=>{
                    console.log(`Attempt ${attempt} has failed.\n`);
                    await sleep(1000);
                    attempt++;
                    if(attempt >= maxAttempts)
                    {
                        success = false;
                    }
                }
            )
        }
        rej();
    });
}
