@echo off
setlocal
title Push ke GitHub - Foto GPS
echo ========================================================
echo   UPLOAD / PUSH KE GITHUB PAGES
echo ========================================================
echo.
echo Pastikan Anda sudah membuat repository baru di GitHub:
echo https://github.com/new (misal dengan nama: fotogps)
echo.
set /p REPO_URL="Masukkan URL Repository GitHub Anda (contoh: https://github.com/fahmikip/fotogps.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] URL tidak boleh kosong!
    pause
    exit /b
)

echo.
echo [1/3] Menyetel remote origin ke: %REPO_URL%
"C:\Program Files\Git\bin\git.exe" remote remove origin 2>nul
"C:\Program Files\Git\bin\git.exe" remote add origin %REPO_URL%

echo [2/3] Memastikan branch utama adalah 'main'...
"C:\Program Files\Git\bin\git.exe" branch -M main

echo [3/3] Mengunggah (push) kode ke GitHub...
"C:\Program Files\Git\bin\git.exe" push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   BERHASIL DI-PUSH KE GITHUB!
    echo ========================================================
    echo Langkah selanjutnya untuk aktifkan GitHub Pages:
    echo 1. Buka repo Anda di browser
    echo 2. Masuk ke Settings -^> Pages
    echo 3. Pada 'Branch', pilih 'main' dan '/(root)' lalu Save.
    echo 4. Tunggu 1 menit, web Anda siap dibuka lewat HTTPS!
    echo ========================================================
) else (
    echo.
    echo [GAGAL] Push tidak berhasil. Periksa koneksi internet atau hak akses GitHub Anda.
)

echo.
pause
