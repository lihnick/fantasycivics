/**
 * Created by Administrator on 2017/4/26 0026.
 */
//R4,User benches a player who is already benched
for(i in USER._userRoster.players)
{
    var player=USER._userRoster.players[i];
    if(player.starter==false)
        console.log(player.pending=="benching");
}

