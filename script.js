let appData = null;
let currentQuiz = [];
let currentIndex = 0;
let score = 0;

// ----- Hàm format số cho văn bản thường (dấu phẩy) -----
function formatNumber(num) {
    if (num === undefined || num === null || isNaN(num)) return num;
    if (Number.isInteger(num) && Math.abs(num) < 1e12) return num.toString();
    let fixed = parseFloat(num.toFixed(6)).toString();
    return fixed.replace('.', ',');
}

// ----- Hàm format số cho MathJax (dấu chấm) -----
function formatNumberMath(num) {
    if (num === undefined || num === null || isNaN(num)) return num;
    if (Number.isInteger(num) && Math.abs(num) < 1e12) return num.toString();
    return parseFloat(num.toFixed(6)).toString();
}

// ----- Chuyển số sang dạng LaTeX (dùng dấu chấm bên trong) -----
function formatScientific(num) {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1e-3 && Math.abs(num) < 1e6) return formatNumberMath(num);
    let exp = Math.floor(Math.log10(Math.abs(num)));
    let mantissa = num / Math.pow(10, exp);
    mantissa = Math.round(mantissa * 100) / 100;
    return `${formatNumberMath(mantissa)} \\times 10^{${exp}}`;
}

// ----- Chuyển số sang dạng hiển thị cho văn bản thường (dấu phẩy, dấu ×) -----
function formatScientificDisplay(num) {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1e-3 && Math.abs(num) < 1e6) return formatNumber(num);
    let exp = Math.floor(Math.log10(Math.abs(num)));
    let mantissa = num / Math.pow(10, exp);
    mantissa = Math.round(mantissa * 100) / 100;
    return `${formatNumber(mantissa)} × 10${exp < 0 ? '⁻' : '⁺'}${String(Math.abs(exp)).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(d)]).join('')}`;
}

// ----- Hàm tạo đáp án nhiễu -----
function generateDistractors(correctValue, unit, count = 3, contextValues = []) {
    let distractors = [];
    let attempts = 0;
    const epsilon = 1e-9;
    const maxAttempts = 500;

    const factors = [1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 0.5, 0.25, 0.75, 1.2, 1.8, 3.5, 7, 9, 12, 15];
    for (let i = 2; i <= 10; i++) {
        factors.push(i);
        factors.push(1 / i);
    }
    const uniqueFactors = [...new Set(factors)];

    function getVariantFromContext(ctx) {
        if (!ctx || ctx === 0 || !isFinite(ctx)) return null;
        let factor = uniqueFactors[Math.floor(Math.random() * uniqueFactors.length)];
        let variant = correctValue * factor;
        if (Math.abs(variant - correctValue) < epsilon * Math.max(1, Math.abs(correctValue))) {
            return null;
        }
        return variant;
    }

    let candidates = [];
    let contextCandidates = [];
    if (contextValues && contextValues.length > 0) {
        let validContext = contextValues.filter(v => v !== 0 && isFinite(v) && Math.abs(v) < 1e10);
        for (let ctx of validContext) {
            for (let i = 0; i < 20; i++) {
                let variant = getVariantFromContext(ctx);
                if (variant !== null) {
                    contextCandidates.push(variant);
                }
            }
        }
        contextCandidates = contextCandidates.sort(() => Math.random() - 0.5);
        for (let v of contextCandidates) {
            if (candidates.length < count * 2) {
                candidates.push(v);
            }
        }
    }

    while (candidates.length < count * 2) {
        let r = Math.random();
        let factor;
        if (r < 0.33) factor = 1.5 + Math.random() * 0.5;
        else if (r < 0.66) factor = 0.4 + Math.random() * 0.3;
        else factor = 2.5 + Math.random() * 2.5;
        if (Math.random() > 0.5) factor = 1 / factor;
        let variant = correctValue * factor;
        variant = Math.round(variant * 100000) / 100000;
        if (Math.abs(variant - correctValue) > epsilon) {
            candidates.push(variant);
        }
    }

    let uniqueCandidates = [];
    let seen = new Set();
    for (let v of candidates) {
        let key = Math.round(v / epsilon) * epsilon;
        if (Math.abs(v - correctValue) > epsilon && !seen.has(key)) {
            seen.add(key);
            uniqueCandidates.push(v);
        }
    }

    let selected = uniqueCandidates.slice(0, count);
    while (selected.length < count && attempts < maxAttempts) {
        let variant = correctValue * (1.5 + Math.random() * 3);
        if (Math.random() > 0.5) variant = correctValue / (1.5 + Math.random() * 3);
        variant = Math.round(variant * 100000) / 100000;
        if (Math.abs(variant - correctValue) > epsilon && !selected.some(d => Math.abs(parseFloat(d) - variant) < epsilon)) {
            selected.push(variant);
        }
        attempts++;
    }

    let result = selected.map(v => formatNumber(v) + ' ' + unit);
    while (result.length < count) {
        let fallback = correctValue * (2 + result.length * 0.7);
        fallback = Math.round(fallback * 100000) / 100000;
        if (Math.abs(fallback - correctValue) > epsilon && !result.some(d => Math.abs(parseFloat(d) - fallback) < epsilon)) {
            result.push(formatNumber(fallback) + ' ' + unit);
        } else {
            break;
        }
    }
    return result;
}

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomFromList(list) {
    return list[Math.floor(Math.random() * list.length)];
}

// ----- Template Handlers (đã kiểm tra kỹ lưỡng) -----
const templateHandlers = {
    resistanceCopperWire: function() {
        const L = randomFromList([30,40,50,60,70]);
        const S = randomFromList([0.45,0.5,0.55,0.6,0.65]);
        const correct = 1.7e-8 * L / (S * 1e-4);
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const text = `Tính điện trở của đoạn dây dẫn bằng đồng nối từ cột điện vào công tơ điện của một gia đình có chiều dài là ${L} m và tiết diện là ${formatNumber(S)} cm².`;
        const context = [L, S];
        let options = generateDistractors(correct, 'Ω', 3, context);
        const correctStr = correctDisplay + ' Ω';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$R = \\rho \\dfrac{\\ell}{S} = 1,7\\times10^{-8} \\cdot \\dfrac{${L}}{${formatNumberMath(S)}\\cdot10^{-4}} = ${correctMath}\\ \\Omega$`
        };
    },
    resistanceMetalWire: function() {
        const metals = ['bạc','đồng','vàng','nhôm','tungsten','sắt','nikelin','manganin','constantan','nicrom'];
        const rhoMap = {
            'bạc':1.47e-8, 'đồng':1.7e-8, 'vàng':2.35e-8, 'nhôm':2.8e-8,
            'tungsten':5.5e-8, 'sắt':12e-8, 'nikelin':40e-8,
            'manganin':43e-8, 'constantan':50e-8, 'nicrom':111e-8
        };
        const name = randomPick(metals);
        const rho = rhoMap[name];
        const L = randomFromList([1,2,3,4,5]);
        const S = randomFromList([0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9]);
        const correct = rho * 10000 * L / S;
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const rhoDisplay = formatScientificDisplay(rho);
        const text = `Tính điện trở của đoạn dây dẫn làm bằng ${name} có chiều dài ${formatNumber(L*1000*S)} cm và tiết diện ${formatNumber(S)} mm². (Điện trở suất của ${name} là ${rhoDisplay} Ωm)`;
        const context = [rho, L, S];
        let options = generateDistractors(correct, 'Ω', 3, context);
        const correctStr = correctDisplay + ' Ω';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$\\ell = ${formatNumberMath(L*1000*S/100)}\\text{m}, S=${formatNumberMath(S)}\\cdot10^{-6}\\text{m}^2, R = \\rho\\dfrac{\\ell}{S} = ${correctMath}\\ \\Omega$`
        };
    },
    resistanceRatio: function() {
        const n = randomFromList([2,3,4,5,6,7,8,9,10]);
        const m = randomFromList([2,3,4,5,6,7,8,9]);
        const correct = n / m;
        const text = `Có hai dây dẫn làm bằng cùng vật liệu. Dây thứ nhất có chiều dài gấp ${n} lần và có tiết diện lớn gấp ${m} lần dây dẫn thứ hai. Hỏi điện trở của dây dẫn thứ nhất lớn gấp mấy lần điện trở của dây dẫn thứ hai?`;
        const options = [
            `${n+m} lần`,
            `${n*m} lần`,
            `${formatNumber(correct)} lần`,
            `${n*n/(m*m)} lần`
        ];
        return { text, options, correct: 2, rationale: `$R_1/R_2 = \\dfrac{\\ell_1/S_1}{\\ell_2/S_2} = \\dfrac{${n}\\ell_2}{${m}S_2}\\cdot\\dfrac{S_2}{\\ell_2} = ${formatNumberMath(correct)}$` };
    },
    cableResistance: function() {
        const n = randomFromList([3,6,12,15]);
        const R = randomFromList([0.3,0.6,0.9,1.2,1.5,1.8,2.1]);
        const correct = R / n;
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const text = `Một dây cáp điện bằng đồng có lõi là ${n} sợi dây đồng xoắn lại với nhau. Điện trở của mỗi sợi dây đồng này là ${formatNumber(R)} Ω. Tính điện trở của dây cáp điện này.`;
        const context = [R, n];
        let options = generateDistractors(correct, 'Ω', 3, context);
        const correctStr = correctDisplay + ' Ω';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$R_{cáp} = \\dfrac{${formatNumberMath(R)}}{${n}} = ${correctMath}\\ \\Omega$`
        };
    },
    rheostatResistance: function() {
        const materials = ['bạc','đồng','vàng','nhôm','tungsten','sắt','nikelin','manganin','constantan','nicrom'];
        const rhoMap = {
            'bạc':1.47e-8, 'đồng':1.7e-8, 'vàng':2.35e-8, 'nhôm':2.8e-8,
            'tungsten':5.5e-8, 'sắt':12e-8, 'nikelin':40e-8,
            'manganin':43e-8, 'constantan':50e-8, 'nicrom':111e-8
        };
        const name = randomPick(materials);
        const rho = rhoMap[name];
        const n = randomFromList([100,150,200,250]);
        const d1 = randomFromList([2,4,6,8,10]);
        const d2 = randomFromList([2,4,6,8,10]);
        const correct = rho * d1 * n * 40000 / (d2 * d2);
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const rhoDisplay = formatScientificDisplay(rho);
        const text = `Xác định điện trở của một biến trở làm bằng dây ${name} cuốn thành ${n} vòng quanh một lõi sứ hình trụ. Biết đường kính của trụ sứ bằng ${d1} cm; đường kính của dây bằng ${d2} mm, điện trở suất của ${name} là ${rhoDisplay} Ωm.`;
        const context = [rho, n, d1, d2];
        let options = generateDistractors(correct, 'Ω', 3, context);
        const correctStr = correctDisplay + ' Ω';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$\\ell = \\pi d_1 n = ${Math.round(3.14*d1*n)}\\text{cm} = ${(3.14*d1*n/100).toFixed(2)}\\text{m}; S = \\pi (d_2/2)^2 = ${(0.785*d2*d2).toFixed(2)}\\text{mm}^2 = ${(0.785*d2*d2*1e-6).toExponential(2)}\\text{m}^2; R = \\rho\\dfrac{\\ell}{S} = ${correctMath}\\ \\Omega$`
        };
    },
    copperWireResistanceMass: function() {
        const S = randomFromList([0.1,0.2,0.4,0.5,0.8]);
        const m = randomFromList([0.1,0.2,0.3,0.4,0.5]);
        const D = 8.9;
        const rho = 1.7e-8;
        const correct = rho * m * 10 / (D * S * S * 1e-6);
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const text = `Một dây đồng có tiết diện là ${formatNumber(S)} mm² và khối lượng là ${formatNumber(m)} kg. Tính điện trở của dây. Biết điện trở suất của đồng là 1,7×10⁻⁸ Ωm, khối lượng riêng của đồng là ${formatNumber(D)} g/cm³.`;
        const context = [m, S];
        let options = generateDistractors(correct, 'Ω', 3, context);
        const correctStr = correctDisplay + ' Ω';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$\\ell = \\dfrac{${formatNumberMath(m)}}{${D} \\cdot ${formatNumberMath(S)}} = ${(m*10/(D*S/100)).toFixed(2)}\\text{m}, R = \\rho\\dfrac{\\ell}{S} = ${correctMath}\\ \\Omega$`
        };
    },
    wireLengthChange: function() {
        const d1 = randomFromList([0.3,0.6,0.9,1.2]);
        const l1 = randomFromList([1.44,2.88,4.32,5.76]);
        const d2 = d1 * 2/3;
        const correct = l1 * 4/9;
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const text = `Người ta dùng dây nikelin làm dây nung cho một bếp điện. Nếu dùng dây với đường kính tiết diện là ${formatNumber(d1)} mm thì dây phải có độ dài là ${formatNumber(l1)} m. Hỏi nếu không thay đổi điện trở của dây nung và vẫn dùng loại dây nikelin với đường kính tiết diện là ${formatNumber(d2)} mm thì dây phải dài bao nhiêu?`;
        const context = [l1, d1, d2];
        let options = generateDistractors(correct, 'm', 3, context);
        const correctStr = correctDisplay + ' m';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$\\ell_2 = \\ell_1\\dfrac{r_2^2}{r_1^2} = ${formatNumberMath(l1)} \\cdot \\dfrac{(${d2/2})^2}{(${d1/2})^2} = ${correctMath}\\text{ m}$`
        };
    },
    currentFromVoltageResistance: function() {
        const R = randomFromList([22,55,88]);
        const correct = 220 / R;
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const text = `Hiệu điện thế giữa hai đầu bàn là điện là 220 V, điện trở của dây nung nóng của bàn là là ${R} Ω. Cường độ dòng điện chạy qua dây nung nóng của bàn là là bao nhiêu?`;
        const context = [R];
        let options = generateDistractors(correct, 'A', 3, context);
        const correctStr = correctDisplay + ' A';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$I = \\dfrac{220}{${R}} = ${correctMath}\\text{ A}$`
        };
    },
    voltageFromCurrentResistance: function() {
        const I = randomFromList([0.5,0.6,0.7,0.8,0.9]);
        const R = randomFromList([290,300,310,320,330]);
        const correct = I * R;
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const text = `Cường độ dòng điện qua dây tóc bóng đèn là ${formatNumber(I)} A, điện trở của dây tóc bóng đèn là ${R} Ω. Xác định hiệu điện thế giữa hai đầu bóng đèn.`;
        const context = [I, R];
        let options = generateDistractors(correct, 'V', 3, context);
        const correctStr = correctDisplay + ' V';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$U = I\\cdot R = ${formatNumberMath(I)} \\cdot ${R} = ${correctMath}\\text{ V}$`
        };
    },
    voltmeterResistance: function() {
        const U = randomFromList([100,125,150,175,200]);
        const I = randomFromList([0.01,0.05,0.1,0.5,1]);
        const correct = U / I;
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const text = `Một vôn kế có giá trị đo tối đa đến ${U} V. Để dòng điện qua vôn kế không được vượt quá ${formatNumber(I)} A thì vôn kế phải có điện trở bằng bao nhiêu?`;
        const context = [U, I];
        let options = generateDistractors(correct, 'Ω', 3, context);
        const correctStr = correctDisplay + ' Ω';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$R \\ge \\dfrac{${U}}{${formatNumberMath(I)}} = ${correctMath}\\ \\Omega$`
        };
    },
    currentMetalWire: function() {
        const metals = ['bạc','đồng','vàng','nhôm','tungsten','sắt','nikelin','manganin','constantan','nicrom'];
        const rhoMap = {
            'bạc':1.47e-8, 'đồng':1.7e-8, 'vàng':2.35e-8, 'nhôm':2.8e-8,
            'tungsten':5.5e-8, 'sắt':12e-8, 'nikelin':40e-8,
            'manganin':43e-8, 'constantan':50e-8, 'nicrom':111e-8
        };
        const name = randomPick(metals);
        const rho = rhoMap[name];
        const L = randomFromList([50,100,200]);
        const S = randomFromList([0.1,0.2,0.5]);
        const R = rho * L / (S * 1e-6);
        const correct = 220 / R;
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const rhoDisplay = formatScientificDisplay(rho);
        const text = `Tính cường độ dòng điện chạy trong dây dẫn làm bằng ${name} với chiều dài là ${L} m và tiết diện là ${formatNumber(S)} mm², nếu hiệu điện thế giữa hai đầu dây là 220 V. (Điện trở suất của ${name} là ${rhoDisplay} Ωm)`;
        const context = [rho, L, S];
        let options = generateDistractors(correct, 'A', 3, context);
        const correctStr = correctDisplay + ' A';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$R = \\rho\\dfrac{\\ell}{S} = ${formatNumberMath(R)}\\Omega; I = \\dfrac{220}{R} = ${correctMath}\\text{ A}$`
        };
    },
    resistanceFromVoltmeterAmmeter: function() {
        const U = randomFromList([100,120,150,200]);
        const I = randomFromList([0.01,0.02,0.05,0.08]);
        const correct = U / I;
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const text = `Một vôn kế đo hiệu điện thế giữa hai đầu một bóng đèn sợi đốt, chỉ ${U} V, còn ampe kế đo cường độ dòng điện qua bóng đèn chỉ ${formatNumber(I)} A. Xác định điện trở của bóng đèn.`;
        const context = [U, I];
        let options = generateDistractors(correct, 'Ω', 3, context);
        const correctStr = correctDisplay + ' Ω';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$R = \\dfrac{${U}}{${formatNumberMath(I)}} = ${correctMath}\\ \\Omega$`
        };
    },
    heaterWireLength: function() {
        const S = randomFromList([0.1,0.2,0.5]);
        const I = randomFromList([5,10,20]);
        const U = 220;
        const rho = 1.1e-6;
        const R = U / I;
        const correct = R * S * 1e-6 / rho;
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const rhoDisplay = formatScientificDisplay(rho);
        const text = `Một lò sưởi điện được đốt nóng bằng dây hợp kim có điện trở suất ${rhoDisplay} Ωm, tiết diện dây đốt là ${formatNumber(S)} mm². Khi hiệu điện thế giữa hai đầu lò sưởi là 220 V thì cường độ dòng điện qua lò sưởi là ${I} A. Xác định chiều dài của dây đốt.`;
        const context = [S, I, rho];
        let options = generateDistractors(correct, 'm', 3, context);
        const correctStr = correctDisplay + ' m';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$R = \\dfrac{220}{${I}} = ${formatNumberMath(R)}\\Omega; \\ell = \\dfrac{R\\cdot ${formatNumberMath(S)}\\cdot10^{-6}}{${formatNumberMath(rho)}} = ${correctMath}\\text{ m}$`
        };
    },
    rheostatMaxResistance: function() {
        const S = randomFromList([0.1,0.2,0.5]);
        const n = randomFromList([300,320,340,360,380,400]);
        const d = randomFromList([1,2,3,4,5]);
        const rho = 0.4e-6;
        const correct = rho * 3.14 * d * n * 10000 / S;
        const correctDisplay = formatNumber(correct);
        const correctMath = formatNumberMath(correct);
        const rhoDisplay = formatScientificDisplay(rho);
        const text = `Dây điện trở của 1 biến trở con chạy được làm bằng hợp kim nikêlin có điện trở suất ${rhoDisplay} Ωm, tiết diện ${formatNumber(S)} mm², quấn được ${n} vòng quanh một lõi sứ hình trụ đường kính ${d} cm. Tính điện trở lớn nhất của biến trở này.`;
        const context = [S, n, d, rho];
        let options = generateDistractors(correct, 'Ω', 3, context);
        const correctStr = correctDisplay + ' Ω';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$\\ell = n\\pi d = ${(3.14*d*n).toFixed(0)}\\text{cm} = ${(3.14*d*n/100).toFixed(2)}\\text{m}; R = \\rho\\dfrac{\\ell}{S} = ${correctMath}\\ \\Omega$`
        };
    },
    seriesVoltage: function() {
        const R1 = randomFromList([2,4,6,8,10]);
        const R2 = R1 * 1.5;
        const I = randomFromList([0.1,0.2,0.4,0.5]);
        const U1 = R1 * I;
        const U2 = R2 * I;
        const text = `Một mạch điện gồm hai điện trở ${R1} Ω và ${formatNumber(R2)} Ω mắc nối tiếp, cường độ dòng điện chạy qua mạch là ${formatNumber(I)} A. Xác định hiệu điện thế giữa hai đầu mỗi điện trở.`;
        const options = [
            `U1 = ${formatNumber(U1)} V; U2 = ${formatNumber(U2)} V`,
            `U1 = ${formatNumber(U1*2)} V; U2 = ${formatNumber(U2*2)} V`,
            `U1 = ${formatNumber(U1/2)} V; U2 = ${formatNumber(U2/2)} V`,
            `U1 = ${formatNumber(U1+1)} V; U2 = ${formatNumber(U2+1)} V`
        ];
        return { text, options, correct: 0, rationale: `$U_1 = R_1\\cdot I = ${R1} \\cdot ${formatNumberMath(I)} = ${formatNumberMath(U1)}\\text{ V}; U_2 = ${formatNumberMath(R2)} \\cdot ${formatNumberMath(I)} = ${formatNumberMath(U2)}\\text{ V}$` };
    },
    voltmeterSeries: function() {
        const I = randomFromList([2,3,6,8,10]);
        const U_AC = I * 6;
        const U_AB = I * 5;
        const U_BC = I;
        const text = `Hai đoạn dây dẫn có điện trở 5 kΩ và 1 kΩ, được mắc nối tiếp như Hình 12.1. Cường độ dòng điện trong mạch là ${I} mA. Xác định số chỉ của vôn kế khi lần lượt mắc vào hai đầu A và C, A và B, B và C.`;
        const options = [
            `U_AC = ${formatNumber(U_AC)} V; U_AB = ${formatNumber(U_AB)} V; U_BC = ${formatNumber(U_BC)} V`,
            `U_AC = ${formatNumber(U_AC*2)} V; U_AB = ${formatNumber(U_AB*2)} V; U_BC = ${formatNumber(U_BC*2)} V`,
            `U_AC = ${formatNumber(U_AC/2)} V; U_AB = ${formatNumber(U_AB/2)} V; U_BC = ${formatNumber(U_BC/2)} V`,
            `U_AC = ${formatNumber(U_AC+1)} V; U_AB = ${formatNumber(U_AB+1)} V; U_BC = ${formatNumber(U_BC+1)} V`
        ];
        return { text, options, correct: 0, rationale: `$U_{AC} = I\\cdot(R_1+R_2) = ${I}\\cdot6 = ${formatNumberMath(U_AC)}\\text{ V}; U_{AB}=${I}\\cdot5=${formatNumberMath(U_AB)}\\text{ V}; U_{BC}=${I}\\cdot1=${formatNumberMath(U_BC)}\\text{ V}$` };
    },
    seriesCircuitAmmeter: function() {
        const R1 = randomFromList([5,10,15]);
        const R2 = 15;
        const R3 = 40 - R1 - R2;
        const U2 = randomFromList([1.5,3,4.5,6]);
        const I = U2 / R2;
        const U_AB = I * 40;
        const text = `Ba điện trở R1 = ${R1} Ω, R2 = ${R2} Ω, R3 = ${R3} Ω được mắc vào mạch điện như Hình 12.2. Vôn kế chỉ ${formatNumber(U2)} V. Xác định số chỉ của ampe kế và hiệu điện thế giữa hai điểm A và B.`;
        const options = [
            `I = ${formatNumber(I)} A; U_AB = ${formatNumber(U_AB)} V`,
            `I = ${formatNumber(I*2)} A; U_AB = ${formatNumber(U_AB*2)} V`,
            `I = ${formatNumber(I/2)} A; U_AB = ${formatNumber(U_AB/2)} V`,
            `I = ${formatNumber(I+0.1)} A; U_AB = ${formatNumber(U_AB+0.1)} V`
        ];
        return { text, options, correct: 0, rationale: `$I = \\dfrac{${formatNumberMath(U2)}}{${R2}} = ${formatNumberMath(I)}\\text{ A}; U_{AB} = I\\cdot 40 = ${formatNumberMath(U_AB)}\\text{ V}$` };
    },
    lampVoltageSeries: function() {
        const U = randomFromList([1,2,3,4,5,6,7,8,9]);
        const text = `Cho sơ đồ mạch điện như Hình 12.3. Hiệu điện thế giữa hai đầu bóng đèn là bao nhiêu nếu điện trở của đèn lớn gấp hai lần điện trở R? Biết số chỉ của vôn kế là ${U} V.`;
        const options = [
            `${formatNumber(U*2)} V`,
            `${formatNumber(U)} V`,
            `${formatNumber(U/2)} V`,
            `${formatNumber(U*3)} V`
        ];
        return { text, options, correct: 0, rationale: `$U_{đèn} = I\\cdot R_{đèn} = \\dfrac{${U}}{R}\\cdot 2R = ${formatNumberMath(U*2)}\\text{ V}$` };
    },
    parallelAmmeter: function() {
        const R2 = randomFromList([3,6,12,15]);
        const R1 = R2 * 2;
        const U = randomFromList([2,4,8,10]);
        const I1 = U / R1;
        const text = `Có hai điện trở R1 = ${R1} Ω và R2 = ${R2} Ω được mắc vào mạch điện như Hình 12.5. Xác định số chỉ của ampe kế A1 nếu vôn kế chỉ ${U} V.`;
        const context = [R1, U];
        let options = generateDistractors(I1, 'A', 3, context);
        const correctStr = formatNumber(I1) + ' A';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$I_1 = \\dfrac{${U}}{${R1}} = ${formatNumberMath(I1)}\\text{ A}$`
        };
    },
    parallelCircuit: function() {
        const Itd = randomFromList([5.5,11,22]);
        const R1 = 110;
        const I1 = 220 / R1;
        const I2 = Itd - I1;
        const R2 = 220 / I2;
        const text = `Có sơ đồ mạch điện như Hình 12.6. Ampe kế A chỉ ${formatNumber(Itd)} A, vôn kế V chỉ 220 V. Điện trở R1 = 110 Ω. Xác định giá trị R2 và số chỉ của các ampe kế A1, A2.`;
        const options = [
            `R2 = ${formatNumber(R2)} Ω; I1 = ${formatNumber(I1)} A; I2 = ${formatNumber(I2)} A`,
            `R2 = ${formatNumber(R2*2)} Ω; I1 = ${formatNumber(I1*2)} A; I2 = ${formatNumber(I2*2)} A`,
            `R2 = ${formatNumber(R2/2)} Ω; I1 = ${formatNumber(I1/2)} A; I2 = ${formatNumber(I2/2)} A`,
            `R2 = ${formatNumber(R2+1)} Ω; I1 = ${formatNumber(I1+1)} A; I2 = ${formatNumber(I2+1)} A`
        ];
        return { text, options, correct: 0, rationale: `$I_1 = \\dfrac{220}{110}=${formatNumberMath(I1)}\\text{ A}; I_2 = ${formatNumberMath(Itd)} - ${formatNumberMath(I1)} = ${formatNumberMath(I2)}\\text{ A}; R_2 = \\dfrac{220}{${formatNumberMath(I2)}} = ${formatNumberMath(R2)}\\ \\Omega$` };
    },
    switchResistance: function() {
        const R1 = randomFromList([1,2,3,4,5,6,7,8]);
        const R2 = 9 - R1;
        const R3 = 18;
        const text = `Đặt một hiệu điện thế U vào hai đầu đoạn mạch có sơ đồ như trên hình sau, trong đó điện trở R1 = ${R1} Ω, R2 = ${R2} Ω. Cho biết số chỉ của ampe kế khi công tắc K mở và khi K đóng hơn kém nhau 3 lần. Tính điện trở R3.`;
        const context = [R1, R2];
        let options = generateDistractors(R3, 'Ω', 3, context);
        const correctStr = formatNumber(R3) + ' Ω';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `Khi K đóng: $I_1 = \\dfrac{U}{9}$; K mở: $I_2 = \\dfrac{U}{9+R_3}$; $\\dfrac{I_1}{I_2} = 3 \\Rightarrow R_3 = 18\\ \\Omega$`
        };
    },
    threeResistorsSwitch: function() {
        const n = randomFromList([2,3,4,5]);
        const m = n + randomFromList([2,3,4,5]);
        const R1 = randomFromList([1,2,3,4,5,6,7,8,9]);
        const R2 = R1 * (n - 1);
        const R3 = R1 * (m - n);
        const text = `Đặt một hiệu điện thế U vào hai đầu đoạn mạch có sơ đồ như trên hình sau. Khi đóng công tắc K vào vị trí 1 thì ampe kế có số chỉ I1 = I, khi chuyển sang vị trí số 2 thì ampe có số chỉ I2 = I/${n}, còn khi chuyển sang vị trí số 3 thì ampe kế có số chỉ I3 = I/${m}. Cho biết R1 = ${R1} Ω, hãy tính R2 và R3.`;
        const options = [
            `R2 = ${formatNumber(R2)} Ω; R3 = ${formatNumber(R3)} Ω`,
            `R2 = ${formatNumber(R2*2)} Ω; R3 = ${formatNumber(R3*2)} Ω`,
            `R2 = ${formatNumber(R2/2)} Ω; R3 = ${formatNumber(R3/2)} Ω`,
            `R2 = ${formatNumber(R2+1)} Ω; R3 = ${formatNumber(R3+1)} Ω`
        ];
        return { text, options, correct: 0, rationale: `$R_2 = R_1(${n}-1) = ${formatNumberMath(R2)}\\Omega; R_3 = R_1(${m}-${n}) = ${formatNumberMath(R3)}\\Omega$` };
    },
    bulbPowerResistanceEnergy: function() {
        const P = randomFromList([3,6,12]);
        const n = randomFromList([1,2,3,4,5]);
        const R = 144 / P;
        const A = P * n;
        const text = `Trên một bóng đèn có ghi 12 V - ${P} W. Đèn này được sử dụng với đúng hiệu điện thế định mức. Hãy tính điện trở của đèn khi đó và điện năng mà đèn sử dụng trong ${n} giờ.`;
        const options = [
            `R = ${formatNumber(R)} Ω; A = ${formatNumber(A)} J`,
            `R = ${formatNumber(R*2)} Ω; A = ${formatNumber(A*2)} J`,
            `R = ${formatNumber(R/2)} Ω; A = ${formatNumber(A/2)} J`,
            `R = ${formatNumber(R+1)} Ω; A = ${formatNumber(A+1)} J`
        ];
        return { text, options, correct: 0, rationale: `$R = \\dfrac{12^2}{${P}} = ${formatNumberMath(R)}\\Omega; A = ${P} \\cdot ${n} = ${formatNumberMath(A)}\\text{ J}$` };
    },
    energyConsumptionBulb: function() {
        const n = randomFromList([1,2,3,4,5,6,7,8,9]);
        const correct = n * 3;
        const text = `Một bóng đèn có ghi 220 V - 100 W được mắc vào hiệu điện thế 220 V. Biết đèn được sử dụng trung bình ${n} giờ một ngày. Điện năng tiêu thụ của bóng đèn này trong 30 ngày là bao nhiêu?`;
        const options = [
            `${formatNumber(correct)} kW.h`,
            `${100*n} kW.h`,
            `${n*n*90} kW.h`,
            `${n*n*2700} kW.h`
        ];
        return { text, options, correct: 0, rationale: `$A = 100\\cdot ${n}\\cdot 30 = ${formatNumberMath(correct)}\\text{ kW.h}$` };
    },
    energySeriesParallel: function() {
        const R = randomFromList([1,2,4,5,8,10]);
        const text = `Hai đoạn dây dẫn, mỗi đoạn có điện trở ${R} Ω. Ban đầu hai điện trở mắc nối tiếp, sau đó được mắc song song. Trong cả hai trường hợp đều mắc đoạn mạch vào hiệu điện thế 4 V. Xét trong cùng một thời gian, với trường hợp nào thì điện năng tiêu thụ lớn hơn và lớn hơn bao nhiêu lần?`;
        const options = [
            `Trường hợp mắc song song, điện năng tiêu thụ gấp 4 lần mắc nối tiếp`,
            `Trường hợp mắc nối tiếp, điện năng tiêu thụ gấp 4 lần mắc song song`,
            `Trường hợp mắc song song, điện năng tiêu thụ gấp 2 lần mắc nối tiếp`,
            `Trường hợp mắc nối tiếp, điện năng tiêu thụ gấp 2 lần mắc song song`
        ];
        return { text, options, correct: 0, rationale: `$A_{//} = \\dfrac{U^2}{R/2}t = 2\\dfrac{U^2}{R}t; A_{nt} = \\dfrac{U^2}{2R}t; \\dfrac{A_{//}}{A_{nt}} = 4$` };
    },
    ironPowerCurrentResistance: function() {
        const A = randomFromList([396,693,990,1386]);
        const P = A * 10 / 9;
        const I = A / 198;
        const R = 43560 / A;
        const text = `Một bàn là điện được sử dụng với đúng hiệu điện thế định mức là 220 V, trong 15 phút tiêu thụ một lượng điện năng là ${A} kJ. Hãy tính công suất điện của bàn là, cường độ dòng điện chạy qua bàn là và điện trở của nó khi đó.`;
        const options = [
            `𝒫 = ${formatNumber(P)} W; I = ${formatNumber(I)} A; R = ${formatNumber(R)} Ω`,
            `𝒫 = ${formatNumber(P*2)} W; I = ${formatNumber(I*2)} A; R = ${formatNumber(R*2)} Ω`,
            `𝒫 = ${formatNumber(P/2)} W; I = ${formatNumber(I/2)} A; R = ${formatNumber(R/2)} Ω`,
            `𝒫 = ${formatNumber(P+1)} W; I = ${formatNumber(I+1)} A; R = ${formatNumber(R+1)} Ω`
        ];
        return { text, options, correct: 0, rationale: `$\\mathcal{P} = \\dfrac{${A}\\cdot1000}{900} = ${formatNumberMath(P)}\\text{ W}; I = \\dfrac{\\mathcal{P}}{220} = ${formatNumberMath(I)}\\text{ A}; R = \\dfrac{220^2}{\\mathcal{P}} = ${formatNumberMath(R)}\\Omega$` };
    },
    energySavedByLED: function() {
        const n = randomFromList([1,2,3,4,5,6,7,8,9]);
        const correct = 48 * n * 3600;
        const text = `Thay bóng đèn sợi đốt 60 W bằng bóng đèn compact công suất 12 W tiết kiệm được bao nhiêu điện năng trong một ngày? Biết mỗi ngày thắp sáng đèn trong ${n} giờ.`;
        const context = [n];
        let options = generateDistractors(correct, 'J', 3, context);
        const correctStr = formatNumber(correct) + ' J';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$A = (60-12)\\cdot ${n}\\cdot3600 = ${formatNumberMath(correct)}\\text{ J}$`
        };
    },
    energyChangeResistance: function() {
        const n = randomFromList([2,3,4,5,6,7,8,9]);
        const text = `Cho đoạn mạch có hiệu điện thế hai đầu không đổi, khi điện trở trong mạch được điều chỉnh tăng ${n} lần thì trong cùng khoảng thời gian, năng lượng tiêu thụ của mạch thay đổi như thế nào?`;
        const options = [
            `giảm ${n} lần`,
            `tăng ${n} lần`,
            `giảm ${n*n} lần`,
            `tăng ${n*n} lần`
        ];
        return { text, options, correct: 0, rationale: `$A = \\dfrac{U^2}{R}t$, khi R tăng ${n}$ lần thì A giảm ${n}$ lần.` };
    },
    frequencyChangeCount: function() {
        const f = randomFromList([30,40,50,60]);
        const correct = 2 * f;
        const text = `Dòng điện xoay chiều có tần số ${f} Hz. Trong mỗi giây, dòng điện đổi chiều bao nhiêu lần?`;
        const context = [f];
        let options = generateDistractors(correct, 'lần', 3, context);
        const correctStr = formatNumber(correct) + ' lần';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `Trong 1 chu kỳ đổi chiều 2 lần, nên trong 1 giây đổi chiều $2\\cdot${f} = ${formatNumberMath(correct)}$ lần.`
        };
    },
    solarPanelArea: function() {
        const Pd = randomFromList([100,200,300]);
        const Pt = Pd * 7/10;
        const correct = (Pd*20 + Pt*10) / 1400;
        const text = `Những ngày trời nắng không có mây, bề mặt có diện tích 1m² của tấm pin mặt trời để ngoài nắng nhận được một năng lượng mặt trời là 1400 J trong 1s. Hỏi cần phủ lên mái nhà một tấm pin mặt trời có diện tích tối thiểu là bao nhiêu để có đủ điện thắp sáng hai bóng đèn có công suất ${Pd} W và một máy thu hình ${formatNumber(Pt)} W. Biết hiệu suất của pin mặt trời là 10%.`;
        const context = [Pd, Pt];
        let options = generateDistractors(correct, 'm²', 3, context);
        const correctStr = formatNumber(correct) + ' m²';
        if (!options.includes(correctStr)) {
            options.splice(Math.floor(Math.random() * (options.length + 1)), 0, correctStr);
        }
        return {
            text,
            options,
            correct: options.indexOf(correctStr),
            rationale: `$A_{cần} = \\dfrac{2\\cdot${Pd}+${formatNumberMath(Pt)}}{0.1} = ${formatNumberMath(correct)}\\text{ m}^2$`
        };
    }
};

// ----- Hàm sinh câu hỏi -----
function generateQuestionFromTemplate(q) {
    if (q.type === 'static') {
        return { ...q };
    }
    const handler = templateHandlers[q.templateId];
    if (handler) {
        return handler();
    } else {
        console.warn('Template not found:', q.templateId);
        return { text: 'Câu hỏi chưa được hỗ trợ', options: ['A','B','C','D'], correct: 0, rationale: 'Vui lòng kiểm tra lại dữ liệu.' };
    }
}

// ----- Load dữ liệu và UI -----
document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            appData = data;
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('setup-screen').classList.remove('hidden');
            populateLessonSelect();
        })
        .catch(error => {
            console.error("Lỗi tải dữ liệu:", error);
            document.getElementById('loading').innerText = "Lỗi tải dữ liệu. Hãy chạy trên local server.";
        });
});

function populateLessonSelect() {
    const select = document.getElementById('lesson-select');
    select.innerHTML = '<option value="all">Tất cả các bài</option>';
    appData.lessons.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson.id;
        option.textContent = lesson.name;
        select.appendChild(option);
    });
}

function startQuiz(difficulty) {
    const lessonId = document.getElementById('lesson-select').value;
    let pool = [];

    if (lessonId === 'all') {
        appData.lessons.forEach(l => pool.push(...l.questions));
    } else {
        const lesson = appData.lessons.find(l => l.id === lessonId);
        if (lesson) pool = [...lesson.questions];
    }

    let levelMap = { easy: ['NB', 'TH'], medium: ['NB', 'TH', 'VD'], hard: ['TH', 'VD', 'VDC'] };
    let levels = levelMap[difficulty] || ['NB', 'TH', 'VD', 'VDC'];
    pool = pool.filter(q => levels.includes(q.level));

    pool = pool.sort(() => Math.random() - 0.5);
    const numQuestions = Math.min(pool.length, 20);
    currentQuiz = pool.slice(0, numQuestions).map(q => generateQuestionFromTemplate(q));

    currentIndex = 0;
    score = 0;
    showScreen('quiz-screen');
    updateQuizTitle(difficulty, lessonId);
    showQuestion();
}

function showQuestion() {
    const q = currentQuiz[currentIndex];
    document.getElementById('progress').innerText = `Câu ${currentIndex + 1}/${currentQuiz.length}`;

    let contentHTML = `<span>${q.text}</span>`;
    if (q.image) {
        contentHTML += `<img src="${q.image}" alt="Minh họa" class="question-image">`;
    }
    document.getElementById('question-content').innerHTML = contentHTML;

    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = "text-left p-4 border-2 border-gray-200 rounded-xl hover:bg-blue-900 hover:border-blue-200 transition flex items-center";
        btn.innerHTML = `<span class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-sm font-bold text-gray-500">${String.fromCharCode(65+i)}</span> <span>${opt}</span>`;
        btn.onclick = () => checkAnswer(i);
        optionsDiv.appendChild(btn);
    });

    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('next-btn').classList.add('hidden');

    if (window.MathJax) MathJax.typesetPromise();
}

function checkAnswer(selectedIdx) {
    const q = currentQuiz[currentIndex];
    const feedback = document.getElementById('feedback');
    const options = document.getElementById('options').children;

    for (let btn of options) btn.onclick = null;

    if (selectedIdx === q.correct) {
        score++;
        options[selectedIdx].classList.add('bg-green-900', 'border-green-500');
        feedback.innerHTML = `<p class="text-green-50 font-bold">Chính xác!</p><p class="text-sm mt-1">${q.rationale || ''}</p>`;
        feedback.className = "block p-4 bg-green-950 border border-green-200 rounded-lg mb-6";
    } else {
        options[selectedIdx].classList.add('bg-red-900', 'border-red-500');
        options[q.correct].classList.add('bg-green-900', 'border-green-500');
        feedback.innerHTML = `<p class="text-red-50 font-bold">Sai rồi!</p><p class="text-sm mt-1">${q.rationale || ''}</p>`;
        feedback.className = "block p-4 bg-red-950 border border-red-200 rounded-lg mb-6";
    }

    const nextBtn = document.getElementById('next-btn');
    nextBtn.classList.remove('hidden');
    nextBtn.innerText = (currentIndex === currentQuiz.length - 1) ? "Xem kết quả" : "Câu tiếp theo";
    
    if (window.MathJax) MathJax.typesetPromise();
}

document.getElementById('next-btn').onclick = () => {
    currentIndex++;
    if (currentIndex < currentQuiz.length) showQuestion();
    else showResults();
};

function showResults() {
    showScreen('result-screen');
    document.getElementById('score-text').innerText = `${score}/${currentQuiz.length}`;
    const percent = (score / currentQuiz.length) * 100;
    let comment = percent >= 90 ? "Xuất sắc! Bạn đã nắm vững kiến thức." :
                  percent >= 70 ? "Khá tốt! Hãy cố gắng thêm chút nữa nhé." :
                  percent >= 50 ? "Đạt yêu cầu. Bạn nên ôn lại các công thức quan trọng." :
                                  "Bạn cần cố gắng nhiều hơn. Hãy đọc kỹ lại sách giáo khoa.";
    document.getElementById('performance-comment').innerText = comment;
}

function showSetup() {
    showScreen('setup-screen');
}

function showScreen(screenId) {
    ['setup-screen', 'quiz-screen', 'result-screen'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function updateQuizTitle(difficulty, lessonId) {
    let diffName = difficulty === 'easy' ? 'Dễ' : (difficulty === 'medium' ? 'Trung bình' : 'Khó');
    let lessonName = lessonId === 'all' ? 'Tổng hợp' : appData.lessons.find(l => l.id === lessonId).name;
    document.getElementById('quiz-title').innerText = `${lessonName} - Mức ${diffName}`;
}