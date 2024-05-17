const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// 穿入wxss配置文件路径
const filePath = 'page-frame.html';
const regex = /pages\/.*?\.wxss/g;

// 读取文件内容并提取所有匹配的路径
fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading file:', filePath, err);
        return;
    }

    // 找到所有匹配的路径
    const matches = [...new Set(data.match(regex))]; // Set 自动去重再转换为数组
    if (matches) {
        console.log('Found matches:', matches);

        // 启动浏览器并打开 HTML 文件
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(`file://${filePath}`);

        // 遍历每个匹配的路径并在页面上下文中执行代码
        for (const match of matches) {
            await page.evaluate((match) => {
                // 执行 __wxAppCode__ 函数
                __wxAppCode__[match]("", { deviceWidth: 375 }, document.body);
            }, match);

            // 获取并打印当前的 document.body 内容
            let bodyContent = await page.evaluate(() => document.body.innerHTML);
            bodyContent = bodyContent.replace(/<div><\/div>/g, '');
            console.log(`Content of document.body after executing match ${match}:`);
            console.log(bodyContent);
            // 定义输出路径，确保目录结构匹配
            const outputDir = path.join('output', path.dirname(match));
            const outputFilePath = path.join(outputDir, `${path.basename(match, '.wxml')}`);

            // 确保目录存在
            fs.mkdirSync(outputDir, { recursive: true });

            // 将内容保存为 .wxss 文件
            fs.writeFileSync(outputFilePath, bodyContent);
        }

        // 关闭浏览器
        await browser.close();
        console.log('All body contents have been stored successfully.');
    } else {
        console.log('No matches found');
    }
});
