# SV5T Frontend

## Chạy local qua HTTPS

Tạo và tin cậy chứng chỉ phát triển một lần:

```powershell
npm run setup:https
```

Chạy backend bằng HTTPS từ thư mục gốc dự án:

```powershell
dotnet run --project api/SV5T.Api.csproj
```

Chạy frontend:

```powershell
cd frontend
npm run dev
```

Truy cập `https://localhost:5173`. Frontend gọi `/api`; Vite proxy request đến
`https://localhost:7080`, vì vậy trình duyệt không gặp lỗi mixed content.

Toàn bộ URL, cổng và đường dẫn chứng chỉ được đọc từ `frontend/.env`. Không đặt
secret trong biến `VITE_*` vì các giá trị này được đóng gói vào mã JavaScript gửi
đến trình duyệt.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
