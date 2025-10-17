El sistema de facturación integrado a FACDIN-API permite generar comprobantes fiscales a través de una aplicación web que cumple con todos los requisitos legales establecidos por el SENIAT. Cada cliente cuenta con una apiKey única y autenticación mediante JWT, lo que garantiza una integración segura y personalizada. Las facturas se almacenan de forma inviolable: al momento de ser registradas en la base de datos, se genera un hash único que certifica su originalidad. Si una factura es modificada por medios externos, el sistema detecta la alteración mediante el hash, permitiendo así un seguimiento confiable y transparente de todos los registros.

Ventajas del sistema FACDIN-API


Funcionalidad	💡 Beneficio
🔐Autenticación con apiKey y JWT
  Seguridad personalizada por cliente
📄Cumplimiento SENIAT	    
  Facturación legal y confiable
🧩Integración vía API	   
  Compatible con sistemas existentes
🧬Generación de hash único	
  Protección contra alteraciones
📁Almacenamiento seguro	Resguardo
  inviolable de la información
🔍Trazabilidad de registros
  seguimiento y auditoría eficiente
⚙️Automatización del proceso
  Ahorro de tiempo y reducción de errores
🌐Acceso web	
  disponibilidad desde cualquier dispositivo

Usuarios de ejemplo para ele cliente:"fcd_1655ec81f7d8209b54430c90ca87930648fae7f37d99a380" Rif: "J33669988" Nombre: "PRUEBA CON AGENTE"
Ficha: 0001 
Clave: Epa12345
Ficha: 0002 
Clave: Epa12345  

Para insertar un empleado en la BD 

$BodyJson = @{
  nombre   = "Coco Pérez"
  ficha    = "0002"
  ci       = 20000001
  rol      = "asesor"
  password = "Epa12345"
  email    = "coco@empresa.com"  # Opcional
} | ConvertTo-Json

try {
  $Response = Invoke-WebRequest `
    -Uri "http://localhost:3001/api/usuarios/registrar" `
    -Method Post `
    -Headers @{
      "x-api-key" ="fcd_baf67a3555713d8721744d019ca4bce06e8558ed8bf84031" # Cambiar por el token de acuerdo al cliente
      "Content-Type" = "application/json"
    } `
    -Body $BodyJson `
    -UseBasicParsing

  $Resultado = $Response.Content | ConvertFrom-Json
  Write-Host "✅ Usuario registrado exitosamente:" -ForegroundColor Green
  $Resultado | Format-List

} catch {
  Write-Host "❌ Error al registrar usuario:" -ForegroundColor Red
  if ($_.ErrorDetails.Message) {
    Write-Host $_.ErrorDetails.Message
  } else {
    Write-Host "No se pudo conectar al servidor o hubo un error interno."
  }
}