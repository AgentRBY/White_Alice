import { Service } from '../../structures/Service';
import { MemberBaseId, Mute } from '../../typings/MemberModel';
import { KARMA_FOR_BAN, KARMA_FOR_MUTE, KARMA_FOR_WARN } from '../../static/Punishment';

export class MutesAction {
  async getMutes(this: Service, id: MemberBaseId): Promise<Mute[]> {
    const MemberData = await this.getMemberData(id);

    return MemberData.mutes;
  }

  async addMute(this: Service, id: MemberBaseId, mute: Mute): Promise<void> {
    const MemberData = await this.getMemberData(id);

    MemberData.mutes.push(mute);

    await this.addKarma(id, KARMA_FOR_MUTE);
    await this.setMemberData(id, MemberData);
  }

  async removeMute(this: Service, id: MemberBaseId, unmutedBy: string, reason?: string): Promise<void> {
    const MemberData = await this.getMemberData(id);

    const mute = MemberData.mutes[MemberData.mutes.length - 1];

    MemberData.mutes[MemberData.mutes.length - 1] = {
      date: mute.date,
      givenBy: mute.givenBy,
      time: mute.time,
      reason: mute.reason,
      unmuted: true,
      unmutedDate: Date.now(),
      unmutedBy,
      unmutedReason: reason,
    };

    await this.removeKarma(id, KARMA_FOR_MUTE);
    await this.setMemberData(id, MemberData);
  }

  async calculateMuteTime(this: Service, id: MemberBaseId, time: number): Promise<number> {
    const karma = (await this.getKarma(id)) || 0;

    return time * (karma / 100 + 1);
  }

  async getKarma(this: Service, id: MemberBaseId): Promise<number> {
    const MemberData = await this.getMemberData(id);

    return MemberData.karma;
  }

  async addKarma(this: Service, id: MemberBaseId, amount: number): Promise<void> {
    const MemberData = await this.getMemberData(id);

    MemberData.karma = (MemberData.karma || 0) + amount;
    await this.setMemberData(id, MemberData);
  }

  async removeKarma(this: Service, id: MemberBaseId, amount: number): Promise<void> {
    const MemberData = await this.getMemberData(id);

    MemberData.karma -= amount;
    await this.setMemberData(id, MemberData);
  }

  async recalculateKarma(this: Service, id: MemberBaseId): Promise<void> {
    const MemberData = await this.getMemberData(id);

    const warns = MemberData.warns.filter((warn) => !warn.removed);
    const mutes = MemberData.mutes.filter((mute) => !mute.unmuted);
    const bans = MemberData.bans;

    const karmaForWarns = warns.length * KARMA_FOR_WARN;
    const karmaForMutes = mutes.length * KARMA_FOR_MUTE;
    const karmaForBans = bans.length * KARMA_FOR_BAN;

    MemberData.karma = karmaForWarns + karmaForMutes + karmaForBans;
    await this.setMemberData(id, MemberData);
  }
}