import fs from "fs";
import path from "path";
import sharp from "sharp";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, } from "discord.js";
import { ASSETS } from "../const.js";
import { fetch } from "undici";
const seiza = [
    {
        id: "ohituji",
        name: "おひつじ座",
        horoscape_st: "01",
    },
    {
        id: "ousi",
        name: "おうし座",
        horoscape_st: "02",
    },
    {
        id: "futago",
        name: "ふたご座",
        horoscape_st: "03",
    },
    {
        id: "kani",
        name: "かに座",
        horoscape_st: "04",
    },
    {
        id: "shishi",
        name: "しし座",
        horoscape_st: "05",
    },
    {
        id: "otome",
        name: "おとめ座",
        horoscape_st: "06",
    },
    {
        id: "tenbin",
        name: "てんびん座",
        horoscape_st: "07",
    },
    {
        id: "sasori",
        name: "さそり座",
        horoscape_st: "08",
    },
    {
        id: "ite",
        name: "いて座",
        horoscape_st: "09",
    },
    {
        id: "yagi",
        name: "やぎ座",
        horoscape_st: "10",
    },
    {
        id: "mizugame",
        name: "みずがめ座",
        horoscape_st: "11",
    },
    {
        id: "uo",
        name: "うお座",
        horoscape_st: "12",
    },
];
const colorParameters = [
    {
        line: "rgb(255,233,90)",
        gradient1: "#EB4E4D",
        gradient2: "#F72221",
        main: "#EB4E4D",
    },
    {
        line: "rgb(255,233,90)",
        gradient1: "rgb(238,177,61)",
        gradient2: "rgb(230,122,47)",
        main: "rgb(232,132,50)",
    },
    {
        line: "rgb(255,233,90)",
        gradient1: "rgb(98,178,52)",
        gradient2: "rgb(76,135,43)",
        main: "rgb(86,158,45)",
    },
    {
        line: "rgb(255,249,212)",
        gradient1: "rgb(77,142,231)",
        gradient2: "rgb(51,74,217)",
        main: "rgb(72,117,229)",
    },
    {
        line: "rgb(255, 194, 227)",
        gradient1: "rgb(68,79,218)",
        gradient2: "rgb(47,38,190)",
        main: "rgb(51,66,203)",
    },
];
const uranai = {
    name: "占い",
    description: "ちいかわ占いを受ける！",
    buttonIdPrefix: "uranai-button-",
    async handler(interaction) {
        const first = new ActionRowBuilder();
        const second = new ActionRowBuilder();
        const third = new ActionRowBuilder();
        for (const { row, start, end } of [
            { row: first, start: 0, end: 5 },
            { row: second, start: 5, end: 10 },
            { row: third, start: 10, end: 12 },
        ]) {
            for (const { id, name } of seiza.slice(start, end)) {
                row.addComponents(new ButtonBuilder()
                    .setCustomId(`uranai-button-${id}`)
                    .setLabel(name)
                    .setStyle(ButtonStyle.Secondary));
            }
        }
        await interaction.reply({
            content: "あなたの星座を教えてね！",
            components: [first, second, third],
        });
    },
    async buttonHandler(interaction) {
        const id = interaction.customId.replace("uranai-button-", "");
        const seizaData = seiza.find((seiza) => seiza.id === id);
        const svgTemplate = fs.readFileSync(path.resolve(ASSETS, "images", "tiikawa-uranai.template.svg"), "utf8");
        const [{ detail }] = await fetch("https://www.asahi.co.jp/data/ohaasa2020/horoscope.json").then((r) => r.json());
        const detailItem = detail.find((item) => item.horoscope_st === seizaData.horoscape_st);
        const parsed = (() => {
            const content = detailItem.horoscope_text.includes("　ラッキー")
                ? detailItem.horoscope_text.split("　ラッキー")[0]
                : detailItem.horoscope_text.split("　")[0];
            const rest = detailItem.horoscope_text.replace(content, "").trim();
            const recognizedLuckies = [
                "ラッキースポット",
                "ラッキーカラー",
                "ラッキーアイテム",
                "ラッキーフード",
                "ラッキーナンバー",
            ];
            const subtitle = recognizedLuckies.find((luck) => rest.startsWith(luck)) ?? "ラッキーアイテム";
            const item = rest.replace(subtitle, "").trim();
            return { content, subtitle, item };
        })();
        const itemParameters = {
            rank: parseInt(detailItem.ranking_no, 10),
            ...parsed,
        };
        if (itemParameters.content.length > 16) {
            let newContent = itemParameters.content.replace(/(.{5}.*[^一-龠ぁ-ゔァ-ヴーa-zA-Z0-9ａ-ｚＡ-Ｚ０-９々〆〤ヶ])([一-龠ぁ-ゔァ-ヴーa-zA-Z0-9ａ-ｚＡ-Ｚ０-９々〆〤ヶ].{5}.*)/u, "$1\n$2");
            if (newContent.split("\n")[0].length > 16) {
                newContent = newContent.replace("\n", "");
            }
            if (newContent === itemParameters.content) {
                itemParameters.content = `${itemParameters.content.slice(0, 16)}\n${itemParameters.content.slice(16)}`;
            }
            itemParameters.content = newContent;
        }
        const parameters = {
            ...colorParameters[itemParameters.rank === 1
                ? 0
                : itemParameters.rank < 6
                    ? 1
                    : itemParameters.rank < 9
                        ? 2
                        : itemParameters.rank < 12
                            ? 3
                            : 4],
            ...itemParameters,
            width1: 38 + 48 * itemParameters.subtitle.length,
            x1: 520 -
                (93 +
                    48 *
                        (itemParameters.subtitle.length + itemParameters.item.length)) /
                    2,
            x2: 70 + 48 * itemParameters.subtitle.length,
            y1: itemParameters.content.includes("\n") ? 200 : 230,
            content1: itemParameters.content.split("\n")[0],
            content2: itemParameters.content.split("\n").at(1) ?? "",
            images: path.resolve(path.dirname(import.meta.url.replace("file://", "")), "..", "assets", "images"),
            seiza: seizaData.name,
        };
        const svg = svgTemplate.replace(/__([A-Z0-9]+)__/g, (_, param) => {
            return parameters[param.toLowerCase()]
                .toString();
        });
        const buffer = await sharp(Buffer.from(svg, "utf8"))
            .png()
            .toBuffer();
        await interaction.reply({
            files: [
                buffer,
            ],
        });
    },
};
export default uranai;
