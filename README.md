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
   git remote add origin https://github.com/j2vhttcknq-max/team-inputs-viewer.git
   git push -u origin main
   ```
3. 在 GitHub 仓库设置中打开 `Pages`
4. 选择 `main` 分支、`root` 目录作为发布源
5. 保存后等待 GitHub 发布，页面地址通常为：
   `https://j2vhttcknq-max.github.io/team-inputs-viewer/`

## 让 Web Link 显示最新 Excel 数据

项目已修改为优先从 GitHub 仓库中加载最新 Excel 文件。如果你想通过 Excel 更新页面数据，请按照下面方式上传：

### 上传 Excel 的位置

- 目标仓库：`https://github.com/j2vhttcknq-max/team-inputs-viewer`
- 建议文件名：`team-inputs.xlsx`
- 建议存放位置：仓库根目录
- GitHub Raw 地址：
  `https://raw.githubusercontent.com/j2vhttcknq-max/team-inputs-viewer/main/team-inputs.xlsx`

### 上传方式

#### 方式 1：GitHub 网页上传

1. 进入仓库页面
2. 点击 `Add file` → `Upload files`
3. 选择你的 `team-inputs.xlsx`
4. 在提交说明中写 `Update team-inputs.xlsx`
5. 点击 `Commit changes`

#### 方式 2：本地 Git 上传

```bash
cd /Users/michaelshi/Desktop/Prod/team-inputs-viewer
cp /path/to/your/team-inputs.xlsx .
git add team-inputs.xlsx
git commit -m "Update team-inputs.xlsx"
git push origin main
```

### 数据更新规则

- 页面加载时会尝试从上述 GitHub Raw 地址读取最新 Excel 文件
- 如果 `team-inputs.xlsx` 不存在，会继续回退到原来的 Box 数据、内嵌数据或 `team-inputs.json`
- 每次你更新并推送 `team-inputs.xlsx` 后，刷新页面即可看到最新数据

> 如果你希望把 Excel 放到子目录，比如 `data/team-inputs.xlsx`，只需把 `GITHUB_EXCEL_URL` 在 `script.js` 中改成对应路径。

## 访问方式

- 直接访问 `index.html`
- 默认数据来自 `team-inputs.json`
- 也可上传本地 Excel 文件进行动态查看
