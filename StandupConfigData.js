class StandupConfigData{
    constructor(roleId,channelId,standupMorningTime,standupEveningTime,standupLeaderBoardTime) {
        this.RoleId = roleId;
        this.ChannelId = channelId;
        this.StandupMorningTime = standupMorningTime;
        this.StandupEveningTime = standupEveningTime;
        this.StandupLeaderBoardTime = standupLeaderBoardTime;
    }
}

module.exports = StandupConfigData