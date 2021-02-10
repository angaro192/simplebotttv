class CommandRules {
    client = null
    admin = ["angarodonordeste"]

    static cargos = {
        moderator: "mod",
        subscriber: "sub",
        vip: "vip",
        broadcaster: "streamer"
    }

    constructor(_client){
        this.client = _client
    }

    static podeExecutar(user, cargos){
        let userCargos = []
        if(user.badges.moderator){
            userCargos.push(CommandRules.cargos.moderator)
        }
        if (user.badges.broadcaster) {
            userCargos.push(CommandRules.cargos.broadcaster);
        }
        if (user.badges.subscriber) {
            userCargos.push(CommandRules.cargos.subscriber);
        }
        if (user.badges.vip) {
            userCargos.push(CommandRules.cargos.vip);
        }
        let interseccao = userCargos.some((element) => cargos.includes(element))
        return interseccao
    }
}

module.exports = CommandRules