class LeaderBoardStudentData{
    constructor(channelId,studentId,score,streak,isStreak)
    {
        this.ChannelId = channelId;
        this.StudentId = studentId;
        this.Score = score;
        this.Streak = streak;
        this.IsStreak = isStreak;
    }
}

module.exports = LeaderBoardStudentData