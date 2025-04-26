# PedidosYa Sort By Price (Tampermonkey Script)

## ¿Qué es?
Es un script para [Tampermonkey](https://www.tampermonkey.net/) (o Greasemonkey/Violentmonkey si preferís) que le agrega botones para ordenar por precio a las páginas de PedidosYa. Simple y útil.

## ¿Qué hace?
* **Agrega Botones:** Pone botones de "Precio Menor ↑" y "Precio Mayor ↓" arriba de las secciones de productos en PedidosYa.
* **Ordena por Precio:** Te deja reorganizar los productos de una sección según el precio, para arriba o para abajo.
* **No rompe nada:** Usa CSS Flexbox (`order`) para reordenar todo sin hacer quilombo en el diseño original.
* **Detecta automáticamente:** Sabe si estás en PedidosYa Market, un Super o un Restaurante y aplica la lógica correcta según el caso.
* **Funciona con SPA:** Como PedidosYa es una Single Page Application, el script revisa periódicamente si hay cambios para que siga funcionando cuando navegás entre secciones.

## Requisitos
* [Tampermonkey](https://www.tampermonkey.net/) (o alguno similar) instalado.

## Instalación
1. Instalá Tampermonkey primero.
2. Hacé clic en el link al archivo `.user.js` en el repo:
   * [https://github.com/Sn0wfly/PeYaSBP/raw/main/PeYaSBP.user.js](https://github.com/Sn0wfly/PeYaSBP/raw/main/PeYaSBP.user.js)
3. Tampermonkey va a detectar el script y te va a preguntar si querés instalarlo.
4. Dale una mirada a los permisos (solo usa `GM_addStyle` y acceso a PedidosYa) y hacé clic en **Instalar**.
5. ¡Listo! Andá a PedidosYa y deberías ver los botones para ordenar.

## ¡Ojo con esto!
PedidosYa actualiza su sitio seguido. Esto puede hacer que los selectores CSS del script dejen de funcionar sin aviso. Si deja de andar, seguramente necesite una actualización de los selectores en la parte de `pageConfigs`.

## Autor
* Sn0wFly