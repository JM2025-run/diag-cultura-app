import { type CvfQuestion, type CvcqQuestion, type Quadrant } from './types';

export const CVF_QUESTIONS: CvfQuestion[] = [
    {
        title: "Características Dominantes da Empresa",
        options: [
            { label: "Um lugar muito pessoal, como uma grande família.", value: "Clan" },
            { label: "Um lugar dinâmico e empreendedor, com foco em inovação.", value: "Adhocracy" },
            { label: "Um lugar orientado a resultados, focado em alta competitividade.", value: "Market" },
            { label: "Um lugar muito estruturado e formal, com foco em procedimentos.", value: "Hierarchy" }
        ]
    },
    {
        title: "Estilo de Liderança Organizacional",
        options: [
            { label: "A liderança é considerada mentora e facilitadora.", value: "Clan" },
            { label: "A liderança é considerada inovadora e assumidora de riscos.", value: "Adhocracy" },
            { label: "A liderança é considerada dura, competitiva e exigente.", value: "Market" },
            { label: "A liderança é considerada coordenadora e orientada para a eficiência.", value: "Hierarchy" }
        ]
    },
    {
        title: "Gestão de Funcionários",
        options: [
            { label: "Ênfase no desenvolvimento de talentos e no compromisso.", value: "Clan" },
            { label: "Ênfase em assumir riscos e buscar desafios.", value: "Adhocracy" },
            { label: "Ênfase em metas e desempenho competitivo.", value: "Market" },
            { label: "Ênfase em segurança no trabalho e estabilidade.", value: "Hierarchy" }
        ]
    },
    {
        title: "O que une a Empresa",
        options: [
            { label: "A lealdade e a tradição. O compromisso é elevado.", value: "Clan" },
            { label: "O compromisso com a inovação e o desenvolvimento.", value: "Adhocracy" },
            { label: "O desejo de vencer e o foco na concorrência.", value: "Market" },
            { label: "Regras e políticas formais. A manutenção do sistema.", value: "Hierarchy" }
        ]
    },
    {
        title: "Ênfases Estratégicas",
        options: [
            { label: "Foco no desenvolvimento humano e no bem-estar.", value: "Clan" },
            { label: "Foco em diferenciação, agilidade e inovação.", value: "Adhocracy" },
            { label: "Foco em ações competitivas e domínio de mercado.", value: "Market" },
            { label: "Foco em permanência, controle e estabilidade.", value: "Hierarchy" }
        ]
    },
    {
        title: "Critérios de Sucesso",
        options: [
            { label: "Desenvolvimento de pessoas, trabalho em equipe e coesão.", value: "Clan" },
            { label: "Produtos ou serviços novos, agilidade e inovação.", value: "Adhocracy" },
            { label: "Posição de mercado, metas e objetivos atingidos.", value: "Market" },
            { label: "Eficiência e controle, com operações suaves.", value: "Hierarchy" }
        ]
    },
    {
        title: "Tomada de Decisão",
        options: [
            { label: "Baseada em consenso, participação e envolvimento da equipe.", value: "Clan" },
            { label: "Baseada em experimentação, intuição e busca por novas soluções.", value: "Adhocracy" },
            { label: "Rápida e assertiva, focada em oportunidades de mercado e resultados.", value: "Market" },
            { label: "Cautelosa e analítica, baseada em dados e procedimentos estabelecidos.", value: "Hierarchy" }
        ]
    },
    {
        title: "Comunicação Interna",
        options: [
            { label: "Aberta, informal e focada no diálogo e no relacionamento interpessoal.", value: "Clan" },
            { label: "Inspiradora, visionária e focada em compartilhar novas ideias.", value: "Adhocracy" },
            { label: "Direta, objetiva e focada em comunicar metas e resultados.", value: "Market" },
            { label: "Formal, através de canais oficiais e com ênfase na documentação.", value: "Hierarchy" }
        ]
    },
    {
        title: "Recompensa e Reconhecimento",
        options: [
            { label: "Baseado no desenvolvimento pessoal, lealdade e contribuição para a equipe.", value: "Clan" },
            { label: "Baseado na criatividade, na geração de novas ideias e na iniciativa.", value: "Adhocracy" },
            { label: "Baseado no atingimento de metas agressivas e na performance individual.", value: "Market" },
            { label: "Baseado na estabilidade, antiguidade e no cumprimento rigoroso de regras.", value: "Hierarchy" }
        ]
    },
    {
        title: "Tratamento de Falhas",
        options: [
            { label: "Vista como uma oportunidade de aprendizado coletivo e desenvolvimento.", value: "Clan" },
            { label: "Vista como uma parte inevitável e necessária do processo de inovação.", value: "Adhocracy" },
            { label: "Vista como inaceitável, com foco na identificação de culpados e correção rápida.", value: "Market" },
            { label: "Vista como um desvio a ser prevenido através de melhores processos e controles.", value: "Hierarchy" }
        ]
    },
    {
        title: "Foco do Cliente",
        options: [
            { label: "Foco em construir relacionamentos de longo prazo e entender as necessidades do cliente.", value: "Clan" },
            { label: "Foco em surpreender os clientes com produtos e serviços únicos e inovadores.", value: "Adhocracy" },
            { label: "Foco em superar a concorrência e ganhar participação de mercado a todo custo.", value: "Market" },
            { label: "Foco em oferecer um serviço padronizado, confiável e consistente.", value: "Hierarchy" }
        ]
    },
    {
        title: "Ritmo e Ambiente de Trabalho",
        options: [
            { label: "Colaborativo, amigável e com ritmo ponderado.", value: "Clan" },
            { label: "Rápido, ágil, flexível e adaptável às mudanças.", value: "Adhocracy" },
            { label: "Intenso, competitivo e altamente pressionado por resultados.", value: "Market" },
            { label: "Metódico, previsível, estável e com processos bem definidos.", value: "Hierarchy" }
        ]
    }
];

export const CVCQ_QUESTIONS: CvcqQuestion[] = [
    // --- Clã ---
    {
        role: "Mentor",
        quadrant: "Clan",
        label: "Capacidade de ouvir, demonstrar empatia e ajudar no desenvolvimento de outros."
    },
    {
        role: "Facilitador",
        quadrant: "Clan",
        label: "Habilidade de promover o trabalho em equipe, gerenciar conflitos e obter participação."
    },
    {
        role: "Construtor de Equipe",
        quadrant: "Clan",
        label: "Habilidade de fomentar a moral, o espírito de equipe e a coesão do grupo."
    },
    // --- Adhocracia ---
    {
        role: "Inovador",
        quadrant: "Adhocracy",
        label: "Foco em visualizar o futuro, propor novas soluções e facilitar a mudança."
    },
    {
        role: "Negociador",
        quadrant: "Adhocracy",
        label: "Capacidade de representar a organização externamente e adquirir recursos."
    },
    {
        role: "Visionário",
        quadrant: "Adhocracy",
        label: "Capacidade de definir e articular uma visão clara e inspiradora para o futuro."
    },
    // --- Mercado ---
    {
        role: "Produtor",
        quadrant: "Market",
        label: "Orientação para a tarefa, com foco em aumentar a produtividade e alcançar metas."
    },
    {
        role: "Diretor",
        quadrant: "Market",
        label: "Habilidade de planejar, definir objetivos, dar instruções decisivas e claras."
    },
    {
        role: "Competidor",
        quadrant: "Market",
        label: "Mentalidade orientada para a competição, com foco em analisar o mercado e superar os concorrentes."
    },
    // --- Hierarquia ---
    {
        role: "Coordenador",
        quadrant: "Hierarchy",
        label: "Foco em manter a estrutura, ser confiável e organizar processos."
    },
    {
        role: "Monitor",
        quadrant: "Hierarchy",
        label: "Habilidade de analisar dados, garantir o cumprimento de regras e monitorar o desempenho."
    },
    {
        role: "Organizador",
        quadrant: "Hierarchy",
        label: "Capacidade de planejar, organizar e alocar recursos de forma eficiente para executar tarefas complexas."
    }
];

export const QUADRANT_LABELS: Record<Quadrant, string> = {
    Clan: "Clã (Colaborar)",
    Adhocracy: "Adhocracia (Criar)",
    Market: "Mercado (Competir)",
    Hierarchy: "Hierarquia (Controlar)"
};

export const QUADRANT_COLORS: Record<Quadrant, string> = {
    Clan: "#6a8e87",
    Adhocracy: "#f7a53e",
    Market: "#e54a41",
    Hierarchy: "#4b6a9e"
};