<?php

/*
 * This file is part of the Sylius package.
 *
 * (c) Paweł Jędrzejewski
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

declare(strict_types=1);

namespace Owl\Bundle\UiBundle\Renderer;

use Owl\Bundle\UiBundle\Registry\TemplateBlock;

/**
 * @experimental
 */
interface TemplateBlockRendererInterface
{
    public function render(TemplateBlock $templateBlock, array $context = []): string;
}
