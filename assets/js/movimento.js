/*
 * Comportamento da LP IDeia 2.0 (IFI-72).
 *
 * 1. Menu do celular (botão "Menu").
 * 2. Barra de progresso da rolagem no topo do cabeçalho.
 * 3. Entrada ao rolar: marca com .visivel cada [data-anima] que entra na tela.
 * 4. Banner: bolhas seguem os dois anéis e passam por trás da esfera; a grade
 *    acompanha o mouse de leve.
 * 5. Contato: os quatro ícones orbitam a dupla e passam por trás dela.
 *
 * Sem este script a página fica estática, com todo o conteúdo e as ações. Com
 * "reduzir movimento" no sistema, os itens 3 a 5 não rodam.
 */
(function () {
  "use strict";

  var raiz = document.documentElement;
  var movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* 1. Menu do celular */
  var botaoMenu = document.querySelector(".cabecalho__menu");
  var menu = document.getElementById("menu-principal");

  function fecharMenu() {
    if (!botaoMenu) {
      return;
    }
    botaoMenu.setAttribute("aria-expanded", "false");
    menu.classList.remove("aberto");
  }

  if (botaoMenu && menu) {
    botaoMenu.addEventListener("click", function () {
      var abrir = botaoMenu.getAttribute("aria-expanded") !== "true";
      botaoMenu.setAttribute("aria-expanded", String(abrir));
      menu.classList.toggle("aberto", abrir);
      if (abrir) {
        menu.querySelector("a").focus();
      }
    });
    menu.addEventListener("click", function (evento) {
      if (evento.target.closest("a")) {
        fecharMenu();
      }
    });
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && botaoMenu.getAttribute("aria-expanded") === "true") {
        fecharMenu();
        botaoMenu.focus();
      }
    });
  }

  /* 2. Barra de progresso */
  var cabecalho = document.querySelector(".cabecalho");
  var agendado = false;

  function atualizarProgresso() {
    agendado = false;
    var total = raiz.scrollHeight - window.innerHeight;
    var valor = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
    cabecalho.style.setProperty("--progresso", valor.toFixed(4));
  }

  if (cabecalho) {
    window.addEventListener(
      "scroll",
      function () {
        if (!agendado) {
          agendado = true;
          window.requestAnimationFrame(atualizarProgresso);
        }
      },
      { passive: true }
    );
    atualizarProgresso();
  }

  if (movimentoReduzido.matches) {
    return;
  }

  /* 3. Entrada ao rolar */
  if ("IntersectionObserver" in window) {
    var alvos = Array.prototype.slice.call(document.querySelectorAll("[data-anima]"));
    var alturaTela = window.innerHeight || raiz.clientHeight;

    // O que já está na tela ao carregar não anima.
    var jaVisiveis = alvos.filter(function (alvo) {
      var caixa = alvo.getBoundingClientRect();
      return caixa.top < alturaTela && caixa.bottom > 0;
    });
    jaVisiveis.forEach(function (alvo) {
      alvo.classList.add("visivel");
    });
    raiz.classList.add("movimento-ativo");

    var intervalo = function (alvo) {
      var valor = window.getComputedStyle(alvo).getPropertyValue("--motion-escalonamento");
      var numero = parseFloat(valor);
      if (isNaN(numero)) {
        return 0;
      }
      return valor.indexOf("ms") === -1 ? numero * 1000 : numero;
    };

    var observador = new IntersectionObserver(
      function (entradas) {
        var ordem = 0;
        entradas.forEach(function (entrada) {
          if (!entrada.isIntersecting) {
            return;
          }
          var alvo = entrada.target;
          alvo.style.setProperty("--atraso", ordem * intervalo(alvo) + "ms");
          alvo.classList.add("visivel");
          observador.unobserve(alvo);
          ordem += 1;
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    alvos.forEach(function (alvo) {
      if (jaVisiveis.indexOf(alvo) === -1) {
        observador.observe(alvo);
      }
    });
  }

  /*
   * Laço de animação que só roda com a área na tela. O relógio de cada laço
   * só anda enquanto ele roda, então a órbita continua de onde parou.
   */
  function criarLaco(area, passo) {
    var visivel = false;
    var quadro = null;
    var anterior = null;
    var tempo = 0;

    function rodar(agora) {
      if (anterior !== null) {
        tempo += Math.min(agora - anterior, 100) / 1000;
      }
      anterior = agora;
      passo(tempo);
      quadro = window.requestAnimationFrame(rodar);
    }

    var laco = {
      atualizar: function () {
        var deveRodar = visivel;
        if (deveRodar && quadro === null) {
          anterior = null;
          quadro = window.requestAnimationFrame(rodar);
        } else if (!deveRodar && quadro !== null) {
          window.cancelAnimationFrame(quadro);
          quadro = null;
        }
      }
    };

    passo(0);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        visivel = entradas[0].isIntersecting;
        laco.atualizar();
      }).observe(area);
    } else {
      visivel = true;
      laco.atualizar();
    }

    return laco;
  }

  var GRAU = Math.PI / 180;

  /* 4. Banner: anéis planetários */
  var hero = document.querySelector(".hero");
  var bolhas = Array.prototype.slice.call(document.querySelectorAll(".orbita"));

  if (hero && bolhas.length) {
    // Elipses dos anéis no frame de 1440 × 880 do Figma, inclinadas -13°.
    var aneis = {
      externo: { rx: 553.85, ry: 210.85, periodo: 48 },
      interno: { rx: 480, ry: 164.85, periodo: 38 }
    };
    var centroX = 720;
    var centroY = 440;
    var cosInclinacao = Math.cos(-13 * GRAU);
    var senInclinacao = Math.sin(-13 * GRAU);

    var dadosBolhas = bolhas.map(function (bolha) {
      return {
        el: bolha,
        anel: aneis[bolha.getAttribute("data-anel")],
        fase: parseFloat(bolha.getAttribute("data-fase")) * GRAU
      };
    });

    criarLaco(hero, function (tempo) {
      dadosBolhas.forEach(function (d) {
        var angulo = d.fase + (tempo / d.anel.periodo) * 2 * Math.PI;
        var dx = d.anel.rx * Math.cos(angulo);
        var dy = d.anel.ry * Math.sin(angulo);
        var x = centroX + dx * cosInclinacao - dy * senInclinacao;
        var y = centroY + dx * senInclinacao + dy * cosInclinacao;
        var frente = Math.sin(angulo) > 0;
        d.el.style.setProperty("--x", x.toFixed(1) + "px");
        d.el.style.setProperty("--y", y.toFixed(1) + "px");
        d.el.style.setProperty("--profundidade", (0.9 + 0.1 * Math.sin(angulo)).toFixed(3));
        d.el.classList.toggle("orbita--frente", frente);
        d.el.classList.toggle("orbita--atras", !frente);
      });
    });

    // Grade com paralaxe leve, só com mouse
    var grade = document.querySelector(".hero__grade");
    if (grade && window.matchMedia("(pointer: fine)").matches) {
      hero.addEventListener("pointermove", function (evento) {
        var caixa = hero.getBoundingClientRect();
        var px = (evento.clientX - caixa.left) / caixa.width - 0.5;
        var py = (evento.clientY - caixa.top) / caixa.height - 0.5;
        grade.style.setProperty("--px", (px * -24).toFixed(1) + "px");
        grade.style.setProperty("--py", (py * -16).toFixed(1) + "px");
      });
    }
  }

  /* 5. Contato: ícones em volta da dupla */
  var palcoDupla = document.querySelector("[data-orbita-dupla]");

  if (palcoDupla) {
    var icones = Array.prototype.slice.call(palcoDupla.querySelectorAll(".contato__icone")).map(function (icone) {
      return { el: icone, fase: parseFloat(icone.getAttribute("data-fase")) * GRAU };
    });

    criarLaco(palcoDupla, function (tempo) {
      icones.forEach(function (d) {
        var angulo = d.fase + (tempo / 26) * 2 * Math.PI;
        var x = 210 + 222 * Math.cos(angulo);
        var y = 211 + 96 * Math.sin(angulo);
        var frente = Math.sin(angulo) > -0.15;
        d.el.style.setProperty("--x", x.toFixed(1) + "px");
        d.el.style.setProperty("--y", y.toFixed(1) + "px");
        d.el.style.setProperty("--profundidade", (0.88 + 0.12 * Math.sin(angulo)).toFixed(3));
        d.el.classList.toggle("contato__icone--atras", !frente);
      });
    });
  }
})();
