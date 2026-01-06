$projectName = "PersonalAccountsManager"
$zipName = "$projectName`_Setup.zip"
$exclude = @("*.zip", ".git", ".vscode", "Create_Setup.ps1")

$files = Get-ChildItem -Path . -Exclude $exclude

Compress-Archive -Path $files -DestinationPath $zipName -Force

Write-Host "Created $zipName successfully."
