class StandupConfigData{
    constructor(roleId,isActive,channelId,standupMorningTime,standupEveningTime,standupLeaderBoardTime) {
        this.RoleId = roleId;
        this.IsON = isActive;
        this.ChannelId = channelId;
        this.StandupMorningTime = standupMorningTime;
        this.StandupEveningTime = standupEveningTime;
        this.StandupLeaderBoardTime = standupLeaderBoardTime;
    }
}


module.exports = StandupConfigData