;

var facebook;
var messenger;

var station;

!function (ns) {

    var Meta = ns.Meta;
    var Station = ns.Station;

    var Immortals = ns.Immortals;

    facebook = DIMP.Facebook.getInstance();

    facebook.ans.save('moki', Immortals.MOKI);
    facebook.ans.save('hulk', Immortals.HULK);

    var sid = 'gsp-s002@wpjUWg1oYDnkHh74tHQFPxii6q9j3ymnyW';
    sid = facebook.getIdentifier(sid);

    var meta = {
        "version": 1,
        "seed": "gsp-s002",
        "key": {
            "algorithm": "RSA",
            "data": "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDACQ1bmv8V3xSCvVDWy+6P4pOl\n46MkIdKEqZ3Z+kvIrpStO/y5DZMWzTRx1z1Ateibc+QCUREaLvKqECycyRNPO+aD\n04rT5WxZfSuHxf+PxajDQ1rcwImc0JR/PbkUIgD5kb2JrsSfTaEObsrhxKlgimey\nOG9bwcmSud6HzPkWZQIDAQAB\n-----END PUBLIC KEY-----",
            "mode": "ECB",
            "padding": "PKCS1",
            "digest": "SHA256"
        },
        "fingerprint": "Z1HI27oXMvY5oOpA1HaD+6d4t8/tlGty5XU+6+CIkeij5m8xS1C4vRJm3qaLTxSRsnwX6mMgkvxMAu6FfvDWe4/cisWAWt8E+aC7BrgESVanQyglWZLx0OSWDmV1jrE9Y0xAA3HlgxIoMdi3sQ4giV0NxeJHUymGenC+EsbtiUU="
    };
    meta = Meta.getInstance(meta);
    facebook.saveMeta(meta, sid);

    station = new Station(sid, '127.0.0.1', 9394);
    facebook.cacheUser(station);

    messenger = DIMP.Messenger.getInstance();

}(DIMP);