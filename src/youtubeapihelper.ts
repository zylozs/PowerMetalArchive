const https = require('https');
const request = require('request-promise-native');

export type VideoInfo = 
{
    Id:string;
    Title:string;
    UploadDate:string;
    Description:string;
};

export type IgnoredVideoInfo = 
{
    Id:string;
    Title:string;
}

export type ChannelInfo = 
{
    Id:string;
    IgnoredVideos:IgnoredVideoInfo[];
    Videos:VideoInfo[];
};

export class YoutubeAPIHelper
{
    private static m_YoutubeAPIKey:string = '';
    public static SetYoutubeAPIKey(value:string) { this.m_YoutubeAPIKey = value; }

    public static async GetChannelInfo(channelInfo:ChannelInfo, callback:(channelInfo:ChannelInfo, results:number, totalResults:number, nextPageToken:string | undefined) => void, nextPageToken:string | undefined):Promise<void>
    {
        let url:string = `https://www.googleapis.com/youtube/v3/search?key=${this.m_YoutubeAPIKey}&channelId=${channelInfo.Id}&type=video&maxResults=50&part=snippet`;

        if (nextPageToken != undefined)
        {
            url += `&pageToken=${nextPageToken}`;
        }

        const Includes:(videos:VideoInfo[] | IgnoredVideoInfo[], videoId:string) => boolean = (videos:VideoInfo[] | IgnoredVideoInfo[], videoId:string):boolean =>
        {
            for (let video of videos) 
            {
                if (video.Id == videoId)
                {
                    return true;
                }
            }

            return false;
        };

        const AddVideo:(item:any) => void = (item:any):void => 
        {
            const snippet:any = item.snippet;
            const videoId:string = item.id.videoId;

            if (Includes(channelInfo.IgnoredVideos, videoId) || Includes(channelInfo.Videos, videoId))
            {
                return;
            }

            const title:string = snippet.title.toLowerCase();
            const isCollection:boolean = title.includes('power metal') && title.includes('collection');

            if (isCollection)
            {
                channelInfo.Videos.push({ Id: videoId, Title: snippet.title, UploadDate: snippet.publishedAt, Description: '' });
            }
            else 
            {
                channelInfo.IgnoredVideos.push({ Id:videoId, Title:snippet.title });
            }
        };

        let data:any = JSON.parse(await request(url));

        data.items.forEach(AddVideo);
        callback(channelInfo, data.items.length, data.pageInfo.totalResults, data.nextPageToken);
    }

    public static async GetVideoInfos(videoIds:string[], callback:(videoInfo:VideoInfo[]) => void):Promise<void>
    {
        const url:string = `https://www.googleapis.com/youtube/v3/videos?key=${this.m_YoutubeAPIKey}&id=${videoIds.toString()}&part=snippet,id`;
        let data:any = JSON.parse(await request(url));

        let newVideoInfos:VideoInfo[] = [];

        data.items.forEach((item:any) => 
        {
            const snippet:any = item.snippet;
            newVideoInfos.push({ Id:item.id, Title:snippet.title, UploadDate:snippet.publishedAt, Description:snippet.description });
        });

        callback(newVideoInfos);
    }
}