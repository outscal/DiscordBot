class StandupScheduleData{
    constructor(channelId,scheduleJob,scheduleTime)
    {
        this.ChannelId = channelId;
        this.ScheduleJobObject = scheduleJob;
        this.ScheduleTime = scheduleTime;
    }
}

module.exports = StandupScheduleData