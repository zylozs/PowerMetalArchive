const Config = require('./config.json');
const fs = require('fs');
import { YoutubeAPIHelper, ChannelInfo, VideoInfo } from './youtubeapihelper';

async function Main():Promise<void>
{
    let channelInfo:ChannelInfo = { Id:'UCR92vMXlYHVmmC9F_zOwpsQ', IgnoredVideos:[], Videos:[] };

    try
    {
        const loadedArchive:any = require('./archive.json');
        channelInfo = loadedArchive;
    }
    catch (e)
    {

    }

    let resultsProcessed:number = 0;
    let nextPageToken:string | undefined = undefined;

    const SearchCallback:any = (channelInfo:ChannelInfo, results:number, totalResults:number, pageToken:string | undefined) =>
    {
        resultsProcessed += results;

        if (resultsProcessed >= totalResults || pageToken == undefined)
        {
            nextPageToken = undefined;
        }

        nextPageToken = pageToken;
    };

    YoutubeAPIHelper.SetYoutubeAPIKey(Config.YoutubeAPIKey);

    // Get all the videos from the channel and filter them 
    do 
    {
        await YoutubeAPIHelper.GetChannelInfo(channelInfo, SearchCallback, nextPageToken);
    } while (nextPageToken != undefined)

    console.log(`Ignored Videos: ${channelInfo.IgnoredVideos.length}  Videos: ${channelInfo.Videos.length}`);

    // Figure out all the videos with missing descriptions and fill them out
    let videosToPopulate:string[] = [];
    let videoKeys:Map<string, number> = new Map();
    
    for (let i = 0; i < channelInfo.Videos.length; ++i)
    {
        const video:VideoInfo = channelInfo.Videos[i];
        if (video.Description == '')
        {
            videosToPopulate.push(video.Id);
            videoKeys.set(video.Id, i);
        }
    }

    const VideoCallback:any = (videoInfos:VideoInfo[]):void =>
    {
        videoInfos.forEach((video:VideoInfo):void =>
        {
            const index:number = <number>videoKeys.get(video.Id);
            channelInfo.Videos[index] = video;
        });
    };

    while (videosToPopulate.length > 0)
    {
        let ids:string[] = videosToPopulate.splice(0, 50);
        if (ids.length > 0)
        {
            await YoutubeAPIHelper.GetVideoInfos(ids, VideoCallback);
        }
    }

    // Write our archive.json
    try 
    {
        fs.writeFile('./archive.json', JSON.stringify(channelInfo));
    }
    catch (e) 
    {
        console.error(`Failed to save to the archive. Error: ${e}`);
    }
}

Main();