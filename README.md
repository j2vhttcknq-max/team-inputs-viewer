# team-inputs-viewer

这是一个基于静态 HTML/JS 的团队输入展示项目，支持从 `team-inputs.json` 加载数据，并可以上传/解析 Excel 文件。

## 本地部署

```bash
npm install
npm run start
```

> 目前不再依赖 Electron，前端可直接在静态服务器上运行。

## GitHub Pages 部署

1. 在 GitHub 上创建仓库，例如 `team-inputs-viewer`
2. 在本地仓库中执行：
   ```bash
   git init
   git add .
   git commit -m "Initial website version"
   git branch -M main
   git remote add origin https://github.com/michaelshi/team-inputs-viewer.git
   git push -u origin main
   ```
3. 在 GitHub 仓库设置中打开 `Pages`
4. 选择 `main` 分支、`root` 目录作为发布源
5. 保存后等待 GitHub 发布，页面地址通常为：
   `https://michaelshi.github.io/team-inputs-viewer/`

## 访问方式

- 直接访问 `index.html`
- 默认数据来自 `team-inputs.json`
- 也可上传本地 Excel 文件进行动态查看
