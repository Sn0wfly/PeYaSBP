// ==UserScript==
// @name         PedidosYa - Ordenar Productos por Precio v0.23 (FINALÍSIMO - Detecta Supermercados)
// @namespace    http://tampermonkey.net/
// @version      0.23
// @description  Agrega botones para ordenar por precio. Detecta estructura Market/Supermercado vs Restaurante real.
// @author       Sn0wFly
// @match        https://www.pedidosya.com.ar/*
// @match        https://www.pedidosya.cl/*
// @match        https://www.pedidosya.com.uy/*
// @match        https://www.pedidosya.com.py/*
// @match        https://www.pedidosya.com.bo/*
// @match        https://www.pedidosya.com.do/*
// @match        https://www.pedidosya.com.pa/*
// @match        https://www.pedidosya.com.hn/*
// @match        https://www.pedidosya.com.ni/*
// @match        https://www.pedidosya.com.sv/*
// @match        https://www.pedidosya.com.ve/*
// @match        https://www.pedidosya.com.pe/*
// @match        https://www.pedidosya.com.ec/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pedidosya.com
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    console.log(`[PedidosYa Sorter v0.23] ¡SCRIPT EJECUTADO en ${window.location.href}!`);

    // --- Configuración de Selectores ---
    // Selectores GENERALIZADOS para Market/Supermercados (usando solo la primera clase sc-)
    // Selectores ESPECÍFICOS para Restaurantes
    const pageConfigs = {
        market: { // Usado para PYa Market y Supermercados con estructura similar
            type: 'market',
            container: 'div.sc-qc4dvw-0',      // CONTENEDOR: Solo primera clase sc-
            item: 'div.sc-1uudfj-0',          // ITEM: Solo primera clase sc- (el que tiene id=infocard dentro)
            price: 'span.sc-teqjqu-0',        // PRECIO: Solo primera clase sc-
            insertionPoint: 'div.sc-qc4dvw-0' // PUNTO INSERCIÓN = Contenedor
        },
        restaurant: { // Usado para Restaurantes "reales" con estructura diferente
            type: 'restaurant',
            container: 'div#section__products',                 // CONTENEDOR: ID específico
            item: 'div[role="article"][id^="product-card-"]',  // ITEM: Selectores estables de restaurante
            price: 'div[id="price"] span:first-of-type',      // PRECIO: Selectores estables de restaurante
            insertionPoint: 'div.sc-1ts3kbc-0.vSMoq'          // PUNTO INSERCIÓN: Div del título (puede ser frágil)
        }
    };
    const buttonContainerBaseId = 'pedyasorter-button-container';

    let currentConfig = null;
    let checkInterval = null;
    let lastUrl = window.location.href;
    let addedButtonIds = new Set();
    let styleAdded = false;

    // --- FUNCIÓN DE DETECCIÓN DE TIPO MEJORADA (v0.23) ---
    function getCurrentPageType() {
        const url = window.location.href;

        // 1. Check para PYa Market explícito
        if (url.includes('/pedidosya-market-')) {
            console.log("[Sorter Detector] Tipo detectado: market (URL específica)");
            return 'market';
        }

        // 2. Check para URLs que PARECEN de restaurante o supermercado market-like
        if (url.includes('/restaurantes/') && url.includes('-menu')) {
            // --- Comprobación de contenido ---
            // Intentamos encontrar el contenedor específico de RESTAURANTE.
            // Hacemos esto DENTRO de la función que se llama repetidamente,
            // porque el elemento puede no existir al principio.
            const restaurantContainerExists = document.querySelector(pageConfigs.restaurant.container); // Busca 'div#section__products'

            if (restaurantContainerExists) {
                 console.log("[Sorter Detector] Tipo detectado: restaurant (URL genérica + Contenedor encontrado)");
                return 'restaurant'; // Es un restaurante real
            } else {
                 // Si la URL parece de restaurante pero NO encontramos el contenedor específico,
                 // ASUMIMOS que es un Supermercado con estructura de Market.
                 console.log("[Sorter Detector] Tipo detectado: market (URL genérica RESTAURANTE pero SIN Contenedor específico -> Asumiendo Supermercado tipo Market)");
                return 'market';
            }
        }

         // 3. Check para URLs que PARECEN de supermercado (si tuvieran patrón propio)
         // Ejemplo: if (url.includes('/supermercados/') || url.includes('/mercado/')) return 'market';
         // Por ahora, el punto 2 cubre los supermercados bajo /restaurantes/

        console.log("[Sorter Detector] Tipo detectado: null (URL no coincide)");
        return null; // No coincide con nada conocido
    }
    // --- FIN DETECCIÓN DE TIPO ---

    function getSelectors() {
        const pageType = getCurrentPageType(); // Llama a la nueva función
        currentConfig = pageConfigs[pageType] || null;
        return currentConfig;
     }
    function parsePrice(priceText) { if (!priceText) return null; try { const cleanedText = priceText.replace(/[$.]/g, '').replace(',', '.').replace(/\s/g, ''); const price = parseFloat(cleanedText); return isNaN(price) ? null : price; } catch (e) { console.error(`[Sorter v0.23] Error parseando precio: "${priceText}"`, e); return null; } }


     // --- FUNCIÓN DE ORDENAMIENTO (v0.22 - sin cambios necesarios) ---
     // La lógica condicional interna ya funciona porque ahora Dia% será detectado como 'market'
     function sortProductsForContainer(direction, containerElement, config) {
        if (!containerElement || !config) { console.error("[Sorter v0.23] sortProductsForContainer: Falta contenedor o config."); return; }
        console.log(`[Sorter v0.23] ==> Ordenando (${config.type}, ${direction}) aplicando 'order !important':`, containerElement);

        // Usamos config.item que ahora será el correcto para cada tipo
        const productsNodeList = Array.from(containerElement.querySelectorAll(config.item));
        if (!productsNodeList || productsNodeList.length === 0) { console.warn(`[Sorter v0.23] No se encontraron ítems '${config.item}' para ordenar.`); return; }
        console.log(`[Sorter v0.23] Encontrados ${productsNodeList.length} ítems (${config.item}).`);

        const productsData = []; let errorCount = 0;
        productsNodeList.forEach(productElement => {
             // Usamos config.price que ahora será el correcto
            const priceElement = productElement.querySelector(config.price);
            let price = priceElement ? parsePrice(priceElement.textContent) : null;
            if (price === null) { errorCount++; price = direction === 'asc' ? Infinity : -Infinity; }
            productsData.push({ element: productElement, price: price });
        });

        if (errorCount > 0) console.warn(`[Sorter v0.23] ${errorCount}/${productsData.length} precios no parseados/encontrados.`);
        if (productsData.length === 0) { console.error("[Sorter v0.23] No hay datos válidos para ordenar."); return; }

        console.log("[Sorter v0.23] Ordenando datos...");
        productsData.sort((a, b) => { /* ... lógica de comparación ... */ return direction === 'asc' ? a.price - b.price : b.price - a.price; });

        console.log("[Sorter v0.23] Aplicando estilos display:flex y order !important...");
        containerElement.style.setProperty('display', 'flex', 'important');
        containerElement.style.setProperty('flex-wrap', 'wrap', 'important');
        containerElement.style.setProperty('align-items', 'stretch', 'important');

        // Lógica condicional de v0.22 (aplica order al padre en 'restaurant', al item en 'market')
        productsData.forEach((item, index) => {
            if (config.type === 'restaurant') {
                const directChild = item.element.parentNode;
                if (directChild && directChild.parentNode === containerElement) {
                    directChild.style.setProperty('order', index, 'important');
                } else { /* ... warning ... */ item.element.style.setProperty('order', index, 'important'); }
            } else { // market (y supermercados detectados como market)
                 item.element.style.setProperty('order', index, 'important');
            }
        });
        console.log(`[Sorter v0.23] ==> Ordenamiento visual con 'order !important' (${direction}) aplicado.`);
     }
     // --- *** FIN FUNCIÓN ORDENAMIENTO *** ---

    function checkAndAddButtons() { // --- SIN CAMBIOS DESDE v0.22 ---
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) { console.log("[Sorter v0.23] URL cambió, reseteando."); addedButtonIds.clear(); lastUrl = currentUrl; styleAdded = false; document.querySelectorAll(`[id^="${buttonContainerBaseId}"]`).forEach(btn => btn.remove()); const oldStyle = document.getElementById('pedyasorter-styles'); if(oldStyle) oldStyle.remove(); }

        // Llama a getSelectors() que ahora usa la nueva getCurrentPageType()
        const config = getSelectors();
        if (!config) { return; }

        if (!styleAdded && !document.getElementById('pedyasorter-styles')) { /* ... aplicar estilos botones ... */ GM_addStyle(` [id^="${buttonContainerBaseId}"] { padding: 8px; margin-top: 10px; margin-bottom: 15px; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; text-align: center; z-index: 999 !important; position: relative; clear: both; display: block; } [id^="${buttonContainerBaseId}"] button { margin: 0 4px; padding: 6px 12px; cursor: pointer; border: 1px solid #ccc; background-color: white; border-radius: 4px; font-size: 12px; } [id^="${buttonContainerBaseId}"] button:hover { background-color: #e8e8e8; } `); const styleEl = document.createElement('style'); styleEl.id = 'pedyasorter-styles'; styleEl.textContent = `/* Estilos PedyaSorter añadidos */`; document.head.appendChild(styleEl); styleAdded = true; console.log("[Sorter v0.23] Estilos aplicados."); }

        // Usa config.insertionPoint que ahora será el correcto ('div.sc-qc4dvw-0' para market/supermercado)
        const insertionPoints = document.querySelectorAll(config.insertionPoint);
        if (!insertionPoints || insertionPoints.length === 0) { return; }

        const currentFoundButtonIds = new Set();
        insertionPoints.forEach((insertionPoint, index) => {
            let targetProductContainer = null; const parent = insertionPoint.parentNode; if (!parent) return;

             // La lógica de encontrar el targetProductContainer puede simplificarse un poco
             // ya que para market/supermercado, insertionPoint y container SON el mismo elemento.
             if (config.type === 'market') {
                  targetProductContainer = insertionPoint; // En market/supermercado, el punto de inserción ES el contenedor
             } else { // restaurant
                 targetProductContainer = parent.querySelector(config.container); // Buscar #section__products en el padre
             }

            if (!targetProductContainer) {
                 // Log si falla la búsqueda del contenedor en restaurantes
                 if (config.type === 'restaurant') console.warn(`[Sorter v0.23] No se encontró contenedor ${config.container} para el punto de inserción restaurante ${index}`);
                 return;
             }

            const buttonIdSuffix = `${config.type}-${index}`; const uniqueButtonId = `${buttonContainerBaseId}-${buttonIdSuffix}`; currentFoundButtonIds.add(uniqueButtonId);
            let buttonContainer = insertionPoint.previousElementSibling;
            if (!buttonContainer || !buttonContainer.id.startsWith(buttonContainerBaseId)) {
                 // Crear botones (llama a sortProductsForContainer v0.23)
                 buttonContainer = document.createElement('div'); buttonContainer.id = uniqueButtonId; const buttonAsc = document.createElement('button'); buttonAsc.textContent = 'Precio Menor ↑'; buttonAsc.onclick = (e) => { e.stopPropagation(); sortProductsForContainer('asc', targetProductContainer, config); }; const buttonDesc = document.createElement('button'); buttonDesc.textContent = 'Precio Mayor ↓'; buttonDesc.onclick = (e) => { e.stopPropagation(); sortProductsForContainer('desc', targetProductContainer, config); }; buttonContainer.appendChild(buttonAsc); buttonContainer.appendChild(buttonDesc); try { insertionPoint.parentNode.insertBefore(buttonContainer, insertionPoint); addedButtonIds.add(uniqueButtonId); } catch (error) { console.error(`[Sorter v0.23] Error insertando botones ${uniqueButtonId}:`, error); }
            } else { /* ... actualizar handlers ... */
                 if (buttonContainer.id !== uniqueButtonId) { buttonContainer.id = uniqueButtonId; }
                 try { buttonContainer.querySelector('button:nth-child(1)').onclick = (e) => { e.stopPropagation(); sortProductsForContainer('asc', targetProductContainer, config); }; buttonContainer.querySelector('button:nth-child(2)').onclick = (e) => { e.stopPropagation(); sortProductsForContainer('desc', targetProductContainer, config); }; } catch (e) { console.error("[Sorter v0.23] Error re-asignando handlers:", e); }
            }
        });
        addedButtonIds.forEach(id => { /* ... limpieza botones obsoletos ... */ if (!currentFoundButtonIds.has(id)) { console.log("[Sorter v0.23] Limpiando botón obsoleto:", id); const btnElement = document.getElementById(id); if (btnElement) { btnElement.remove(); } addedButtonIds.delete(id); } });
    } // Fin checkAndAddButtons

    if (checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(checkAndAddButtons, 850);
    console.log("[Sorter v0.23] Intervalo de verificación iniciado.");

})();