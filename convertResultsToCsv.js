const {
    writeFileSync,
    readFileSync,
} = require("fs");

const { Parser } = require('json2csv');

const filePath = "_avtotovary_masla-i-zhidkosti_motornye-masla.json";
const ext = /([\s\S]+)\.[0-9a-z]+$/;
const out = filePath.match(ext)[1]+'.csv';

const itemsRaw = readFileSync(filePath, { encoding: "utf-8" });
const items = JSON.parse(itemsRaw);

const simpleItems = items.map(item => {
    const {images} = item;
    item.images = images.join(', ');
    return item;
})

const BRANDS = {
    castrol: ['castrol|кастрол'],
    total: ['total|тотал'],
    motul: ['motul|мотул'],
    mobil: ['mobil|мобил'],
    shell: ['shel|шел|шэл'],
    liquiMoly: ['li|ли', 'mo|мо'],
}

const TYPES = {
    // 30
    t0w30: ['0-|0w|0 w', '-30|w30|w 30'],
    t5w30: ['5-|5w|5 w', '-30|w30|w 30'],
    t10w30: ['10-|10w|10 w', '-30|w30|w 30'],
    // 40
    t0w40: ['0-|0w|0 w', '-40|w40|w 40'],
    t5w40: ['5-|5w|5 w', '-40|w40|w 40'],
    t10w40: ['10-|10w|10 w', '-40|w40|w 40'],
}

const VOLUMES = {
    l4: ['4л|4 л|4l|4 l'],
    l1: ['1л|1 л|1l|1 l'],
}

const MODELS = {
    mobilSuper3000X1: ['super|суп', '3000|3 000', 'x1|х1'],
    mobilSuper2000X1: ['super|суп', '2000|2 000', 'x1|х1'],
    mobilSuper2000X3: ['super|суп', '2000|2 000', 'x3|х3'],
    mobilUltra: ['ult|ул'],
    shellHelixUltra: ['hel|хел|хэл', 'ult|ул'],
    liquiMoly3926OptimalSynth: ['3926|3 926', 'опт|opt'],
    shellHX7: ['HX-7|HX7|HX 7'],
    shellHX8: ['HX-8|HX8|HX 8'],
    totalQuartz9000: ['quartz', '9000'],
    castrolMagnatecDualock: ['magna|магна', 'dual|дуа'],
    motul8100Xcess: ['8100', 'cess'],
}

const includes = {
    brandName: [...BRANDS.motul],
    title: [
        ...MODELS.motul8100Xcess,
        ...TYPES.t5w40,
        ...VOLUMES.l4   
    ],
    // 'Объем (л)': ['4'],
};

const entries = Object.entries(includes);

const filtered = simpleItems.filter(item => {
    if (!item.finalPrice) {
        return false;
    }

    let matched = true;

    for (let [key, values] of entries) {
        // console.log(key, values, item);
        for (const value of values) {
            const vals = value.toLowerCase().trim().split('|');
            let m = false;
            for (const val of vals) {
                m = m || item[key].toLowerCase().trim().includes(val);
            }
            matched = m;
            if (!matched) {
                break;
            }
        }
        if (!matched) {
            break;
        }
    }
    return matched;
});

const tops = filtered.sort((a, b) => Number(b.quantity) - Number(a.quantity));
const minPrices = [...filtered].sort((a, b) => Number(a.finalPrice) - Number(b.finalPrice));
const maxPrices = [...filtered].sort((b, a) => Number(a.finalPrice) - Number(b.finalPrice));
// const maxPrices = filtered.sort((b, a) => Number(a.finalPrice) - Number(b.finalPrice));

// console.log(minPrices.map(el => el.finalPrice));
// console.log(maxPrices.map(el => el.finalPrice));

const minLength = minPrices.length;
const averages = minPrices.reduce((min = [], item, index) => {
    // console.log(typeof min, min);
    if (minLength > 10 && (index < 3 || index >= minLength - 3)) {
        return min;
    } else if (minLength > 5 && (index < 1 || index >= minLength - 1)) {
        return min;
    }
    min.push({price: item.finalPrice, quantity: item.quantity});
    // console.log('pushing', min)
    return min;
}, []);

// console.log(averages);

const averagePrice = averages.reduce((a, b) => a + Number(b.price), 0) / averages.length;
const averageQuantity = averages.reduce((a, b) => {
    // console.log('av qu');
    // console.log('qu', a, b, a.quantity, Number(b.quantity));
    return a + Number(b.quantity)}, 0);
// console.log(averages, minPrices.length, averages.length, averagePrice, averageQuantity);

// console.log(minPrices.map(f => `${f.brandName} ${f.title} ${f.quantity} price: ${f.finalPrice}`));
// console.log(filtered.map(f => `${f.brandName} ${f.title} ${f.quantity}`));
// console.log(items.length);
// console.log(filtered.length);

const json = [];
json.push({
    mark: 'TOP',
    brand: '',
    title: '',
    link: tops?.[0]?.link,
    quantity: tops?.[0]?.quantity,
    finalPrice: tops?.[0]?.finalPrice,
});
json.push({
    mark: 'min',
    brand: '',
    title: '',
    link: minPrices?.[0]?.link,
    quantity: minPrices?.[0]?.quantity,
    finalPrice: minPrices?.[0]?.finalPrice,
});
json.push({
    mark: 'max',
    brand: '',
    title: '',
    link: maxPrices?.[0]?.link,
    quantity: maxPrices?.[0]?.quantity,
    finalPrice: maxPrices?.[0]?.finalPrice,
});
const min3s = minPrices?.reduce((val, item, index) => {
    if (index > 2) {
        return val;
    }
    // console.log('min3s: item:', item.finalPrice)
    val.push({...item});
    return val;
}, []);
const min3Quantities = min3s.reduce((val, item) => {return val+Number(item.quantity)} , 0)
const min3avg = min3s.reduce((val, item) => val+Number(item.finalPrice), 0) / min3s.length;
json.push({
    mark: 'min3',
    brand: '',
    title: '',
    link: '',
    quantity: String(min3Quantities),
    finalPrice: String(min3avg),
});
const max3s = maxPrices?.reduce((val, item, index) => {
    if (index > 2) {
        return val;
    }
    // console.log('max3s: item:', item.finalPrice)
    val.push({...item});
    return val;
}, []);

const max3Quantities = max3s.reduce((val, item) => {return val+Number(item.quantity)} , 0)
const max3avg = max3s.reduce((val, item) => val+Number(item.finalPrice), 0) / min3s.length;
json.push({
    mark: 'max3',
    brand: '',
    title: '',
    link: '',
    quantity: String(max3Quantities),
    finalPrice: String(max3avg),
});

json.push({
    mark: 'avg',
    brand: '',
    title: '',
    link: '',
    quantity: String(averageQuantity),
    finalPrice: String(averagePrice),
});

console.log(json);

const json2csvParser = new Parser();
const parsed = json2csvParser.parse(json);

let out2  = '';
for (const [key, val] of entries) {
    out2 += `${key}-${val.join('-')}`;
}
out2 += '.csv'
writeFileSync(out2, parsed);